import { ImovelDTO, ImovelFluxoDTO, ImovelParcelaDTO } from "../../../../domain/imovel/dto/imovel.dto";

export interface ImovelRepositoryInterface {
    // cria imóvel + fluxos + parcelas em uma transação
    create(imovel: ImovelDTO, fluxos: ImovelFluxoDTO[], parcelas: ImovelParcelaDTO[]): Promise<void>;
    findByUserId(userId: string): Promise<ImovelDTO[]>;
    findById(id: string): Promise<ImovelDTO | undefined>;
    update(imovel: ImovelDTO): Promise<void>;
    delete(id: string): Promise<void>;

    findFluxosByImovelIds(imovelIds: string[]): Promise<ImovelFluxoDTO[]>;
    findFluxoById(id: string): Promise<ImovelFluxoDTO | undefined>;
    addFluxo(fluxo: ImovelFluxoDTO, parcelas: ImovelParcelaDTO[]): Promise<void>;
    deleteFluxo(id: string): Promise<void>;

    findParcelasByImovelIds(imovelIds: string[]): Promise<ImovelParcelaDTO[]>;
    findParcelaById(id: string): Promise<ImovelParcelaDTO | undefined>;
    updateParcela(parcela: ImovelParcelaDTO): Promise<void>;
}
