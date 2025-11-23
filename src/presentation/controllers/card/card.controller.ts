import CardControllerInterface from "../../../app/@shared/card/controller/card-controller.interface";
import CardUseCaseInterface from "../../../app/@shared/card/usecases/card.usecase.interface";

export default class CardController implements CardControllerInterface {
    constructor(
        private useCase: CardUseCaseInterface
    ) {}

    async create(req: any, res: any): Promise<any> {
        try {
            await this.useCase.create(req.body);

            return res.status(201).json({ message: 'Card created successfully' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };

    async findByUserId(req: any, res: any): Promise<any> {
        try {
            const cards = await this.useCase.findByUserId(req.query.userId);

            return res.status(200).json(cards);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };

    async findById(req: any, res: any): Promise<any> {
        try {
            const card = await this.useCase.findById(req.query.id);

            return res.status(200).json(card);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };

    async update(req: any, res: any): Promise<any> {
        try {
            await this.useCase.update(req.body);

            return res.status(200).json({ message: 'Card updated successfully' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };
};