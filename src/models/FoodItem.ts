// OOP CONCEPT: Encapsulation — FoodItem protects item identity and price via private properties and getters
export class FoodItem {
  private foodId: number;
  private name: string;
  private price: number;
  private emoji: string;
  private category: string;
  private description: string;

  constructor(
    foodId: number,
    name: string,
    price: number,
    emoji: string,
    category: string,
    description: string
  ) {
    this.foodId = foodId;
    this.name = name;
    this.price = price;
    this.emoji = emoji;
    this.category = category;
    this.description = description;
  }

  public getFoodId(): number {
    return this.foodId;
  }

  public getName(): string {
    return this.name;
  }

  public getPrice(): number {
    return this.price;
  }

  public getEmoji(): string {
    return this.emoji;
  }

  public getCategory(): string {
    return this.category;
  }

  public getDescription(): string {
    return this.description;
  }

  public displayFood(): string {
    return `${this.foodId}. ${this.name} - Rs. ${this.price.toFixed(2)}`;
  }
}
