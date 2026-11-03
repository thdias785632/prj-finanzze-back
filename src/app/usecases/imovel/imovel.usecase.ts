import { injectable, inject } from "inversify";
import { randomUUID } from "crypto";
import ImovelUseCaseInterface, {
    inputAddFluxo, inputCreateImovel, inputFluxo, inputPayParcela, inputUpdateImovel, inputUpdateParcela
} from "../../@shared/imovel/usecases/imovel.usecase.interface";
import { ImovelRepositoryInterface } from "../../@shared/imovel/repository/imovel.repository.interface";
import { IndiceUseCaseInterface } from "../../@shared/indice/usecases/indice.usecase.interface";
import {
    FLUXO_TIPOS, FluxoTipo, ImovelDTO, ImovelDetalheDTO, ImovelFluxoDTO, ImovelFluxoDetalheDTO,
    ImovelParcelaCalculadaDTO, ImovelParcelaDTO, ImovelResumoDTO, INDEX_TYPES, IndexType
} from "../../../domain/imovel/dto/imovel.dto";
import { addMonthsDate, computeIndexFactor, isValidDate, referenceMonthFor, round2, toYm, VariationMap } from "./incc-calculator";
import { HttpError } from "../indice/indice.usecase";

const FLUXO_LABEL: Record<FluxoTipo, string> = {
    ENTRADA: 'Entrada / sinal',
    MENSAIS: 'Parcelas mensais',
    INTERMEDIARIAS: 'Intermediárias',
    CHAVES: 'Entrega das chaves',
    FINANCIAMENTO: 'Financiamento',
    OUTRO: 'Outro'
};

@injectable()
export class ImovelUseCase implements ImovelUseCaseInterface {
    constructor(
        @inject('ImovelRepository')
        private imovelRepository: ImovelRepositoryInterface,
        @inject('IndiceUseCase')
        private indiceUseCase: IndiceUseCaseInterface
    ) {}

    private today(): string {
        // data de hoje no fuso de Brasília
        return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    }

    // ---------- validação / montagem ----------

    private normalizeBaseMonth(value: string | undefined, fallbackDate: string): string {
        const raw = value || fallbackDate;

        if (!/^\d{4}-(0[1-9]|1[0-2])(-\d{2})?$/.test(raw)) {
            throw new HttpError(400, 'inccBaseMonth deve estar no formato YYYY-MM');
        }

        return `${raw.slice(0, 7)}-01`;
    }

    private validateLag(lag: unknown): number {
        const value = lag === undefined || lag === null ? 2 : Number(lag);

        if (!Number.isInteger(value) || value < 0 || value > 12) {
            throw new HttpError(400, 'inccLagMonths deve ser um inteiro entre 0 e 12');
        }

        return value;
    }

    private buildFluxo(imovelId: string, userId: string, input: inputFluxo): { fluxo: ImovelFluxoDTO; parcelas: ImovelParcelaDTO[] } {
        if (!FLUXO_TIPOS.includes(input.type)) throw new HttpError(400, `Tipo de fluxo inválido: ${input.type}`);

        const count = Number(input.installmentsCount);
        const amount = Number(input.installmentAmount);
        const periodicity = input.periodicityMonths === undefined ? 1 : Number(input.periodicityMonths);
        const indexType: IndexType = input.indexType || (input.type === 'FINANCIAMENTO' ? 'NONE' : 'INCC');

        if (!Number.isInteger(count) || count < 1 || count > 600) throw new HttpError(400, 'installmentsCount deve ser um inteiro entre 1 e 600');
        if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'installmentAmount deve ser maior que zero');
        if (!isValidDate(input.firstDueDate)) throw new HttpError(400, 'firstDueDate inválida (use YYYY-MM-DD)');
        if (!Number.isInteger(periodicity) || periodicity < 1 || periodicity > 24) throw new HttpError(400, 'periodicityMonths deve ser um inteiro entre 1 e 24');
        if (!INDEX_TYPES.includes(indexType)) throw new HttpError(400, `indexType inválido: ${indexType}`);

        const fluxo: ImovelFluxoDTO = {
            id: randomUUID(),
            imovelId,
            userId,
            type: input.type,
            description: (input.description || FLUXO_LABEL[input.type]).trim().slice(0, 255),
            installmentsCount: count,
            installmentAmount: round2(amount),
            firstDueDate: input.firstDueDate,
            periodicityMonths: periodicity,
            indexType,
            createdAt: new Date()
        };

        const parcelas: ImovelParcelaDTO[] = Array.from({ length: count }, (_, index) => ({
            id: randomUUID(),
            imovelId,
            fluxoId: fluxo.id,
            userId,
            number: index + 1,
            dueDate: addMonthsDate(input.firstDueDate, index * periodicity),
            baseAmount: fluxo.installmentAmount,
            paid: false,
            createdAt: new Date()
        }));

        return { fluxo, parcelas };
    }

    private async getOwnedImovel(id: string, userId: string): Promise<ImovelDTO> {
        if (!id || !userId) throw new HttpError(400, 'id e userId são obrigatórios');

        const imovel = await this.imovelRepository.findById(id);

        // 404 também para imóvel de outro usuário (não revela que existe)
        if (!imovel || imovel.userId !== userId) throw new HttpError(404, 'Imóvel não encontrado');

        return imovel;
    }

    // ---------- cálculo ----------

    private calculateParcelas(
        imovel: ImovelDTO, fluxos: ImovelFluxoDTO[], parcelas: ImovelParcelaDTO[], variations: VariationMap
    ): ImovelParcelaCalculadaDTO[] {
        const fluxoById = new Map(fluxos.map((f) => [f.id, f]));
        const today = this.today();
        const baseYm = toYm(imovel.inccBaseMonth);

        return parcelas.map((parcela) => {
            const fluxo = fluxoById.get(parcela.fluxoId) as ImovelFluxoDTO;
            let factor = 1;
            let estimated = false;
            let referenceMonth: string | undefined;

            if (fluxo.indexType === 'INCC') {
                referenceMonth = referenceMonthFor(parcela.dueDate, imovel.inccLagMonths);

                const result = computeIndexFactor(baseYm, referenceMonth, variations);

                factor = result.factor;
                estimated = result.estimated;
            }

            const corrected = round2(parcela.baseAmount * factor);

            return {
                ...parcela,
                fluxoType: fluxo.type,
                fluxoDescription: fluxo.description,
                totalNumbers: fluxo.installmentsCount,
                indexType: fluxo.indexType,
                referenceMonth,
                correctionFactor: Math.round(factor * 1e8) / 1e8,
                correctedAmount: corrected,
                estimated: estimated && !parcela.paid,
                currentAmount: parcela.paid ? (parcela.paidAmount ?? corrected) : corrected,
                overdue: !parcela.paid && parcela.dueDate < today
            };
        });
    }

    private buildResumo(imovel: ImovelDTO, parcelas: ImovelParcelaCalculadaDTO[], variations: VariationMap): ImovelResumoDTO {
        const paid = parcelas.filter((p) => p.paid);
        const open = parcelas.filter((p) => !p.paid);
        const totalPaid = round2(paid.reduce((sum, p) => sum + p.currentAmount, 0));
        const totalRemaining = round2(open.reduce((sum, p) => sum + p.currentAmount, 0));
        const total = totalPaid + totalRemaining;
        const next = [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        const months = [...variations.keys()].sort();

        return {
            ...imovel,
            plannedTotal: round2(parcelas.reduce((sum, p) => sum + p.baseAmount, 0)),
            totalPaid,
            totalRemaining,
            paidInstallments: paid.length,
            totalInstallments: parcelas.length,
            progressPercentage: total > 0 ? Math.round((totalPaid / total) * 1000) / 10 : 0,
            financingAmount: round2(open.filter((p) => p.fluxoType === 'FINANCIAMENTO').reduce((sum, p) => sum + p.currentAmount, 0)),
            overdueCount: open.filter((p) => p.overdue).length,
            nextInstallment: next,
            lastIndexMonth: months[months.length - 1]
        };
    }

    // ---------- casos de uso ----------

    async create(input: inputCreateImovel): Promise<{ id: string }> {
        if (!input.userId) throw new HttpError(400, 'userId é obrigatório');
        if (!input.name || !input.name.trim()) throw new HttpError(400, 'name é obrigatório');
        if (!isValidDate(input.contractDate)) throw new HttpError(400, 'contractDate inválida (use YYYY-MM-DD)');

        const totalValue = Number(input.totalValue);

        if (!Number.isFinite(totalValue) || totalValue < 0) throw new HttpError(400, 'totalValue inválido');
        if (input.deliveryDate && !isValidDate(input.deliveryDate)) throw new HttpError(400, 'deliveryDate inválida');
        if (input.financingStartDate && !isValidDate(input.financingStartDate)) throw new HttpError(400, 'financingStartDate inválida');
        if (!Array.isArray(input.fluxos) || input.fluxos.length === 0) throw new HttpError(400, 'Informe ao menos um fluxo de pagamento');

        const imovel: ImovelDTO = {
            id: randomUUID(),
            userId: input.userId,
            name: input.name.trim().slice(0, 255),
            developer: input.developer?.trim() || undefined,
            address: input.address?.trim() || undefined,
            totalValue: round2(totalValue),
            contractDate: input.contractDate,
            inccBaseMonth: this.normalizeBaseMonth(input.inccBaseMonth, input.contractDate),
            inccLagMonths: this.validateLag(input.inccLagMonths),
            deliveryDate: input.deliveryDate || undefined,
            financingStartDate: input.financingStartDate || undefined,
            notes: input.notes?.trim() || undefined,
            active: true,
            createdAt: new Date()
        };

        const built = input.fluxos.map((fluxo) => this.buildFluxo(imovel.id, imovel.userId, fluxo));

        await this.imovelRepository.create(imovel, built.map((b) => b.fluxo), built.flatMap((b) => b.parcelas));

        await this.indiceUseCase.ensureInccCoverage(toYm(imovel.inccBaseMonth));

        return { id: imovel.id };
    }

    async findByUserId(userId: string): Promise<ImovelResumoDTO[]> {
        if (!userId) throw new HttpError(400, 'userId é obrigatório');

        const imoveis = await this.imovelRepository.findByUserId(userId);
        const ids = imoveis.map((i) => i.id);

        const [fluxos, parcelas, variations] = await Promise.all([
            this.imovelRepository.findFluxosByImovelIds(ids),
            this.imovelRepository.findParcelasByImovelIds(ids),
            this.indiceUseCase.getInccVariations()
        ]);

        return imoveis.map((imovel) => {
            const calculadas = this.calculateParcelas(
                imovel,
                fluxos.filter((f) => f.imovelId === imovel.id),
                parcelas.filter((p) => p.imovelId === imovel.id),
                variations
            );

            return this.buildResumo(imovel, calculadas, variations);
        });
    }

    async findById(id: string, userId: string): Promise<ImovelDetalheDTO> {
        const imovel = await this.getOwnedImovel(id, userId);

        const [fluxos, parcelas, variations] = await Promise.all([
            this.imovelRepository.findFluxosByImovelIds([id]),
            this.imovelRepository.findParcelasByImovelIds([id]),
            this.indiceUseCase.getInccVariations()
        ]);

        const calculadas = this.calculateParcelas(imovel, fluxos, parcelas, variations);

        const fluxosDetalhe: ImovelFluxoDetalheDTO[] = fluxos.map((fluxo) => {
            const items = calculadas.filter((p) => p.fluxoId === fluxo.id).sort((a, b) => a.number - b.number);

            return {
                ...fluxo,
                parcelas: items,
                paidCount: items.filter((p) => p.paid).length,
                totalPaid: round2(items.filter((p) => p.paid).reduce((sum, p) => sum + p.currentAmount, 0)),
                totalRemaining: round2(items.filter((p) => !p.paid).reduce((sum, p) => sum + p.currentAmount, 0))
            };
        });

        return { imovel: this.buildResumo(imovel, calculadas, variations), fluxos: fluxosDetalhe };
    }

    async update(input: inputUpdateImovel): Promise<void> {
        const imovel = await this.getOwnedImovel(input.id, input.userId);

        const updated: ImovelDTO = { ...imovel };

        if (input.name !== undefined) {
            if (!input.name.trim()) throw new HttpError(400, 'name não pode ser vazio');
            updated.name = input.name.trim().slice(0, 255);
        }
        if (input.developer !== undefined) updated.developer = input.developer.trim() || undefined;
        if (input.address !== undefined) updated.address = input.address.trim() || undefined;
        if (input.notes !== undefined) updated.notes = input.notes.trim() || undefined;
        if (input.active !== undefined) updated.active = !!input.active;

        if (input.totalValue !== undefined) {
            const value = Number(input.totalValue);

            if (!Number.isFinite(value) || value < 0) throw new HttpError(400, 'totalValue inválido');
            updated.totalValue = round2(value);
        }

        if (input.deliveryDate !== undefined) {
            if (input.deliveryDate && !isValidDate(input.deliveryDate)) throw new HttpError(400, 'deliveryDate inválida');
            updated.deliveryDate = input.deliveryDate || undefined;
        }

        if (input.financingStartDate !== undefined) {
            if (input.financingStartDate && !isValidDate(input.financingStartDate)) throw new HttpError(400, 'financingStartDate inválida');
            updated.financingStartDate = input.financingStartDate || undefined;
        }

        // Defasagem e mês-base só alteram o cálculo (o valor corrigido é calculado na leitura).
        if (input.inccLagMonths !== undefined) updated.inccLagMonths = this.validateLag(input.inccLagMonths);
        if (input.inccBaseMonth !== undefined) updated.inccBaseMonth = this.normalizeBaseMonth(input.inccBaseMonth, imovel.inccBaseMonth);

        await this.imovelRepository.update(updated);

        if (updated.inccBaseMonth !== imovel.inccBaseMonth) {
            await this.indiceUseCase.ensureInccCoverage(toYm(updated.inccBaseMonth));
        }
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.getOwnedImovel(id, userId);
        await this.imovelRepository.delete(id);
    }

    async addFluxo(input: inputAddFluxo): Promise<{ id: string }> {
        const imovel = await this.getOwnedImovel(input.imovelId, input.userId);
        const { fluxo, parcelas } = this.buildFluxo(imovel.id, imovel.userId, input);

        await this.imovelRepository.addFluxo(fluxo, parcelas);

        return { id: fluxo.id };
    }

    async deleteFluxo(id: string, userId: string): Promise<void> {
        const fluxo = await this.imovelRepository.findFluxoById(id);

        if (!fluxo || fluxo.userId !== userId) throw new HttpError(404, 'Fluxo não encontrado');

        const parcelas = await this.imovelRepository.findParcelasByImovelIds([fluxo.imovelId]);

        if (parcelas.some((p) => p.fluxoId === id && p.paid)) {
            throw new HttpError(409, 'Este fluxo tem parcelas pagas. Desfaça os pagamentos antes de excluir.');
        }

        await this.imovelRepository.deleteFluxo(id);
    }

    private async getOwnedParcela(id: string, userId: string): Promise<ImovelParcelaDTO> {
        const parcela = await this.imovelRepository.findParcelaById(id);

        if (!parcela || parcela.userId !== userId) throw new HttpError(404, 'Parcela não encontrada');

        return parcela;
    }

    async payParcela(input: inputPayParcela): Promise<void> {
        const parcela = await this.getOwnedParcela(input.id, input.userId);
        const paidAt = input.paidAt || this.today();

        if (!isValidDate(paidAt)) throw new HttpError(400, 'paidAt inválida (use YYYY-MM-DD)');

        let paidAmount: number;

        if (input.paidAmount !== undefined && input.paidAmount !== null) {
            paidAmount = Number(input.paidAmount);

            if (!Number.isFinite(paidAmount) || paidAmount <= 0) throw new HttpError(400, 'paidAmount deve ser maior que zero');
        } else {
            // Sem valor informado: congela o valor corrigido de hoje.
            const imovel = await this.getOwnedImovel(parcela.imovelId, input.userId);
            const [fluxos, variations] = await Promise.all([
                this.imovelRepository.findFluxosByImovelIds([imovel.id]),
                this.indiceUseCase.getInccVariations()
            ]);

            const [calculada] = this.calculateParcelas(imovel, fluxos, [{ ...parcela, paid: false }], variations);

            paidAmount = calculada.correctedAmount;
        }

        await this.imovelRepository.updateParcela({ ...parcela, paid: true, paidAt, paidAmount: round2(paidAmount) });
    }

    async unpayParcela(id: string, userId: string): Promise<void> {
        const parcela = await this.getOwnedParcela(id, userId);

        await this.imovelRepository.updateParcela({ ...parcela, paid: false, paidAt: undefined, paidAmount: undefined });
    }

    async updateParcela(input: inputUpdateParcela): Promise<void> {
        const parcela = await this.getOwnedParcela(input.id, input.userId);

        if (parcela.paid) throw new HttpError(409, 'Desfaça o pagamento antes de editar a parcela');

        const updated = { ...parcela };

        if (input.baseAmount !== undefined) {
            const amount = Number(input.baseAmount);

            if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'baseAmount deve ser maior que zero');
            updated.baseAmount = round2(amount);
        }

        if (input.dueDate !== undefined) {
            if (!isValidDate(input.dueDate)) throw new HttpError(400, 'dueDate inválida (use YYYY-MM-DD)');
            updated.dueDate = input.dueDate;
        }

        await this.imovelRepository.updateParcela(updated);
    }
}
