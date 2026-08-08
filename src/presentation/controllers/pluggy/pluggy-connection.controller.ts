import { PluggyConnectionUseCaseInterface } from "../../../app/@shared/pluggy/usecase/pluggy.usecase.interface";

export default class PluggyConnectionController {
    constructor(
        private useCase: PluggyConnectionUseCaseInterface
    ) {}

    // POST /api/pluggy/connections { userId, itemId }
    // itemId: id do Item já criado na Pluggy (no caso da conta demo, pego direto no
    // Dashboard sandbox da Pluggy ou via Pluggy Connect, sem precisar de tela no nosso front).
    async connect(req: any, res: any): Promise<any> {
        try {
            const { userId, itemId } = req.body;

            if (!userId || !itemId) {
                return res.status(400).json({ message: 'userId e itemId são obrigatórios' });
            }

            await this.useCase.connectItem({ userId, itemId });

            return res.status(201).json({ message: 'Item Pluggy conectado e sincronizado com sucesso' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };
}
