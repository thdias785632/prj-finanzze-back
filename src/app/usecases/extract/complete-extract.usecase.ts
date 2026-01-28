import { inject } from "inversify";
import { injectable } from "inversify";
import { CardExpensesRepositoryInterface } from "../../@shared/card-expenses/repository/card-expenses-repository.interface";
import { format } from "date-fns";
import { CompleteExtractDTO } from "../../../domain/extracts/dto/complete-extract.dto";
import { CardExpensesDto, CardExtractDto } from "../../../domain/card-expenses/dto/card-expenses.dto";
import { CompleteExtractUseCaseInterface } from "../../@shared/extract/usecase/complete-extract.usecase.interface";
import { ExpensessRepositoryInterface } from "../../@shared/expensses/repositories/expensess.repository.interface";
import { ExpensessDTO } from "../../../domain/expensess/dto/expensess.dto";
import { RevenuesRepositoryInterface } from "../../@shared/revenues/repositories/revenues.repository.interface";
import { RevenuesDTO } from "../../../domain/revenues/dto/revenues.dto";
import { CardRepositoryInterface } from "../../@shared/card/repository/card-repository.interface";

@injectable() 
export class CompleteExtractUseCase implements CompleteExtractUseCaseInterface {
  constructor(
    @inject("CardExpensesRepository")
    private cardExpensesRepository: CardExpensesRepositoryInterface,

    @inject("ExpensessRepository")
    private expensessRepository: ExpensessRepositoryInterface,

    @inject("RevenuesRepository")
    private revenuesRepository: RevenuesRepositoryInterface,

    @inject("CardRepository")
    private cardRepository: CardRepositoryInterface,
  ) {}

  async execute(userId: string, month: string): Promise<CompleteExtractDTO> {
    let extract: CompleteExtractDTO = {
      totalExpensess: 0,
      totalRevenues: 0,
      totalCardExpensess: 0,
      revenues: [],
      fixedExpensess: [],
      cardExpensess: [],
    };

    const referenceDate = new Date(month);

    referenceDate.setHours(referenceDate.getHours() + 3);
    
    const expensess = await this.mapExpensess(extract, userId, referenceDate);

    const cardExpenses = await this.mapCardExpenses(extract, userId, referenceDate);

    await this.mapRecurrentExpenses(extract, cardExpenses, expensess, referenceDate);
    
    const revenues = await this.mapRevenues(extract, userId, referenceDate);

    await this.mapRecurrentRevenues(extract, revenues, referenceDate);

    return extract
  }

  private async mapExpensess(
    extract: CompleteExtractDTO, 
    userId:string, 
    referenceDate: Date
  ): Promise<ExpensessDTO[]> {
    const expensess = await this.expensessRepository.findByUserId(userId);

    for (const expenses of expensess) {
      const reference = format(referenceDate, 'MM/yyyy');
      const month = format(new Date(expenses.referenceDate), 'MM/yyyy');
      
      if(!expenses.active && format(new Date(), 'MM/yyyy') === reference) {
        extract.fixedExpensess.push({
          id: expenses.id,
          name: expenses.name,
          value: expenses.value,
          category: expenses.category,
          referenceDate: expenses.referenceDate,
          active: expenses.active,
          recurrent: expenses.recurrent,
        })

        continue;
      }

      if (expenses.recurrent || month !== reference) {
        continue;
      }

      extract.totalExpensess = (extract.totalExpensess || 0) + expenses.value;
      
      extract.fixedExpensess.push({
        id: expenses.id,
        name: expenses.name,
        value: expenses.value,
        category: expenses.category,
        referenceDate: expenses.referenceDate,
        active: expenses.active,
        recurrent: expenses.recurrent,
      })
    }

    return expensess;
  }

  private async mapCardExpenses(
    extract: CompleteExtractDTO, 
    userId: string, 
    referenceDate: Date
  ): Promise<CardExpensesDto[]> {
    const cardExpenses = await this.cardExpensesRepository.findByUserId(userId);

    for (const cardExpense of cardExpenses) {
      const reference = format(referenceDate, 'MM/yyyy');
      const date = new Date(cardExpense.referenceDate);
      
      if (!cardExpense.active && reference === format(new Date(), "MM/yyyy")) {
        continue;
      }

      if (cardExpense.recurrent) {
        continue;
      }

      if (cardExpense.installments && cardExpense.installments > 0) {
        for (let i = 0; i < cardExpense.installments; i++) {
          const dateToAdd = new Date(cardExpense.referenceDate)

          const month = format(new Date(dateToAdd.setMonth(dateToAdd.getMonth() + i)), 'MM/yyyy');

          if (month !== reference) {
            continue;
          }

          extract.totalExpensess = (extract.totalExpensess || 0) + cardExpense.value;
          extract.totalCardExpensess = (extract.totalCardExpensess || 0) + cardExpense.value;

          extract.cardExpensess.push({
            id: cardExpense.id,
            name: cardExpense.name,
            value: cardExpense.value,
            category: cardExpense.category,
            referenceDate: cardExpense.referenceDate,
            active: cardExpense.active,
            installments: cardExpense.installments,
            recurrent: cardExpense.recurrent,
            cardId: cardExpense.cardId,
          })
        }

        continue;
      }

      if (reference === format(date, "MM/yyyy")) {
        extract.totalExpensess = (extract.totalExpensess || 0) + cardExpense.value;
        extract.totalCardExpensess = (extract.totalCardExpensess || 0) + cardExpense.value;
        
        extract.cardExpensess.push({
          id: cardExpense.id,
          name: cardExpense.name,
          value: cardExpense.value,
          category: cardExpense.category,
          referenceDate: cardExpense.referenceDate,
          active: cardExpense.active,
          installments: cardExpense.installments,
          recurrent: cardExpense.recurrent,
        })
      }
    }

    return cardExpenses;
  }

  private async mapRecurrentExpenses(
    extract: CompleteExtractDTO, 
    cardExpenses: CardExpensesDto[], 
    expensess: ExpensessDTO[],
    refererenceDate: Date
  ) {
    for (const cardExpense of cardExpenses.filter((expense) => expense.recurrent)) {
      if (!cardExpense.active && format(new Date(), 'MM/yyyy') === format(refererenceDate, 'MM/yyyy')) {
        continue;
      }
      
      if (cardExpense.referenceDate > refererenceDate) {
        continue;
      }
      
      extract.totalExpensess = (extract.totalExpensess || 0) + cardExpense.value;
      extract.totalCardExpensess = (extract.totalCardExpensess || 0) + cardExpense.value;
      
      extract.cardExpensess.push({
        id: cardExpense.id,
        name: cardExpense.name,
        value: cardExpense.value,
        category: cardExpense.category,
        referenceDate: cardExpense.referenceDate,
        active: cardExpense.active,
        installments: cardExpense.installments,
        recurrent: cardExpense.recurrent,
        cardId: cardExpense.cardId,
      });
    }

    for (const expenses of expensess.filter((expense) => expense.recurrent)) {
      if (!expenses.active && format(new Date(), 'MM/yyyy') === format(refererenceDate, 'MM/yyyy')) {
        continue;
      }
      
      extract.totalExpensess = (extract.totalExpensess || 0) + expenses.value;
      
      extract.fixedExpensess.push({
        id: expenses.id,
        name: expenses.name,
        value: expenses.value,
        category: expenses.category,
        referenceDate: expenses.referenceDate,
        active: expenses.active,
        recurrent: expenses.recurrent,
      });
    }
  }

  private async mapRevenues(
    extract: CompleteExtractDTO,
    userId: string,
    referenceDate: Date
  ): Promise<RevenuesDTO[]> {
    const revenues = await this.revenuesRepository.findByUserId(userId);

    for (const revenue of revenues) {
      const reference = format(referenceDate, 'MM/yyyy');
      const month = format(new Date(revenue.referenceDate), 'MM/yyyy');

      if(!revenue.active && format(new Date(), 'MM/yyyy') === reference) {
        continue;
      }

      if (revenue.recurrent || month !== reference) {
        continue;
      }

      extract.totalRevenues = (extract.totalRevenues || 0) + revenue.value;

      extract.revenues.push({
        id: revenue.id,
        name: revenue.name,
        value: revenue.value,
        referenceDate: revenue.referenceDate,
        active: revenue.active,
        recurrent: revenue.recurrent,
      });
    }

    return revenues;
  }

  private async mapRecurrentRevenues(
    extract: CompleteExtractDTO,
    revenues: RevenuesDTO[],
    referenceDate: Date
  ): Promise<void> {
    for (const revenue of revenues.filter((revenue) => revenue.recurrent)) {
      if (!revenue.active && format(new Date(), 'MM/yyyy') === format(referenceDate, 'MM/yyyy')) {
        continue;
      }

      extract.totalRevenues = (extract.totalRevenues || 0) + revenue.value;

      extract.revenues.push({
        id: revenue.id,
        name: revenue.name,
        value: revenue.value,
        referenceDate: revenue.referenceDate,
        active: revenue.active,
        recurrent: revenue.recurrent,
      });
    }
  }

  async executeCardsExtract(userId: string, month: string): Promise<CardExtractDto[]> {
    const cards = await this.cardRepository.findByUserId(userId);

    let cardsExtract: CardExtractDto[] = [];

    if (!cards || cards.length === 0) {
      return cardsExtract;
    }

    for (const card of cards) {
      const cardExtract = {
        card,
        total: 0,
        cardExpensess: []
      }
    
      const cardExpensess = await this.cardExpensesRepository.findByCardId(card.id);
  
      const referenceDate = new Date(month);
      referenceDate.setHours(referenceDate.getHours() + 3);
  
      this.mapCardExtractExpenses(cardExtract, cardExpensess, referenceDate);
  
      this.mapRecurrentCardExpenses(cardExtract, cardExpensess);

      cardsExtract.push(cardExtract);
    }

    return cardsExtract;
  }

  private mapCardExtractExpenses(
      cardExtract: CardExtractDto,
      cardExpenses: CardExpensesDto[],
      referenceDate: Date
  ): void {
      for (const cardExpense of cardExpenses) {
          const reference = format(referenceDate, 'MM/yyyy');

          const date = new Date(cardExpense.referenceDate);
        
          if (!cardExpense.active || cardExpense.recurrent) {
              continue;
          }
      
          if (cardExpense.installments && cardExpense.installments > 0) {
              for (let i = 0; i < cardExpense.installments; i++) {
                const dateToAdd = new Date(cardExpense.referenceDate)
                
                const month = format(new Date(dateToAdd.setMonth(dateToAdd.getMonth() + i)), 'MM/yyyy');

                if (month !== reference) {
                    continue;
                }
        
                cardExtract.total = (cardExtract.total || 0) + cardExpense.value;

                cardExpense.installmentsActual = i + 1;
        
                cardExtract.cardExpensess.push(cardExpense)
              }
      
              continue;
          }

          if (reference === format(date, "MM/yyyy")) {
                  cardExtract.total = (cardExtract.total || 0) + cardExpense.value;
              
              cardExtract.cardExpensess.push(cardExpense);
          }
      }
  }

  private async mapRecurrentCardExpenses(
      cardExtract: CardExtractDto,
      cardExpenses: CardExpensesDto[], 
  ): Promise<void> {
      for (const cardExpense of cardExpenses.filter((expense) => expense.recurrent)) {
        if (!cardExpense.active) {
          continue;
        }
        
        cardExtract.total = (cardExtract.total || 0) + cardExpense.value;
        
        cardExtract.cardExpensess.push(cardExpense);
      }
  }
}