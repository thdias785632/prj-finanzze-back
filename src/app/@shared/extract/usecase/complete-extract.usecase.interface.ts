import { CardExtractDto } from "../../../../domain/card-expenses/dto/card-expenses.dto";
import { CompleteExtractDTO } from "../../../../domain/extracts/dto/complete-extract.dto";

export interface CompleteExtractUseCaseInterface {
    execute(userId: string, month: string): Promise<CompleteExtractDTO>;
    executeCardsExtract(userId: string, month: string): Promise<CardExtractDto[]>;
}