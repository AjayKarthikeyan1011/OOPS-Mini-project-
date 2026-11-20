import { User } from './User';
import { FoodItem } from './FoodItem';

// OOP CONCEPT: Inheritance — Restaurant extends User and adds restaurant-specific menu collection
export class Restaurant extends User {
  private restaurantName: string;

  // OOP CONCEPT: Collections (Array) — Restaurant holds the menu as a typed FoodItem[] array
  private menu: FoodItem[] = [
    new FoodItem(1, 'Pizza', 250, '🍕', 'Italian', 'Wood-fired mozzarella, fresh basil, and rich tomato sauce'),
    new FoodItem(2, 'Burger', 120, '🍔', 'Fast Food', 'Flame-grilled patty with aged cheddar and crisp greens'),
    new FoodItem(3, 'Pasta', 180, '🍝', 'Italian', 'Al dente penne tossed in spiced garlic marinara'),
    new FoodItem(4, 'Sandwich', 100, '🥪', 'Bakery', 'Toasted sourdough layered with fresh garden vegetables'),
    new FoodItem(5, 'Biryani', 220, '🍛', 'Main Course', 'Fragrant long-grain basmati rice with aromatic spices'),
    new FoodItem(6, 'Cold Coffee', 90, '🥤', 'Beverage', 'Chilled espresso blended smooth with milk and cocoa'),
  ];

  constructor(id: number, owner: string, address: string, restaurantName: string) {
    super(id, owner, address);
    this.restaurantName = restaurantName;
  }

  public getRestaurantName(): string {
    return this.restaurantName;
  }

  public getMenu(): FoodItem[] {
    return this.menu;
  }

  // OOP CONCEPT: Polymorphism — Overrides User.displayDetails()
  public override displayDetails(): string {
    return `Restaurant: ${this.restaurantName} · Owner: ${this.getName()} · Location: ${this.getAddress()}`;
  }

  public displayMenu(): string {
    return this.menu.map((food) => food.displayFood()).join('\n');
  }
}
