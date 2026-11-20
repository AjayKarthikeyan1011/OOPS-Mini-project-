import java.util.*;
import java.util.logging.*;
import java.io.*;

// ================= USER CLASS =================
class User {
    private int userId;
    private String name;
    private String address;

    public User(int userId, String name, String address) {
        this.userId = userId;
        this.name = name;
        this.address = address;
    }

    public int getUserId() { return userId; }
    public String getName() { return name; }
    public String getAddress() { return address; }

    public void displayDetails() {
        System.out.println("User ID: " + userId);
        System.out.println("Name: " + name);
        System.out.println("Address: " + address);
    }
}

// ================= CUSTOMER =================
class Customer extends User {
    public Customer(int id, String name, String address) {
        super(id, name, address);
    }

    @Override
    public void displayDetails() {
        System.out.println("\nCustomer: " + getName());
        System.out.println("Customer ID: " + getUserId());
        System.out.println("Address: " + getAddress());
    }
}

// ================= FOOD ITEM =================
class FoodItem {
    private int foodId;
    private String name;
    private double price;

    public FoodItem(int foodId, String name, double price) {
        this.foodId = foodId;
        this.name = name;
        this.price = price;
    }

    public int getFoodId() { return foodId; }
    public String getName() { return name; }
    public double getPrice() { return price; }

    public void displayFood() {
        System.out.printf("%d. %s - Rs. %.2f%n", foodId, name, price);
    }
}

// ================= RESTAURANT =================
class Restaurant extends User {
    private String restaurantName;

    // ARRAY
    private FoodItem[] menu = {
        new FoodItem(1, "Pizza", 250),
        new FoodItem(2, "Burger", 120),
        new FoodItem(3, "Pasta", 180),
        new FoodItem(4, "Sandwich", 100)
    };

    public Restaurant(int id, String owner, String address, String restaurantName) {
        super(id, owner, address);
        this.restaurantName = restaurantName;
    }

    public FoodItem[] getMenu() { return menu; }

    @Override
    public void displayDetails() {
        System.out.println("\nRestaurant: " + restaurantName);
        System.out.println("Owner: " + getName());
        System.out.println("Address: " + getAddress());
    }

    public void displayMenu() {
        System.out.println("\n--- RESTAURANT MENU ---");
        for (FoodItem food : menu) {   // LOOP
            food.displayFood();
        }
    }
}

// ================= PAYMENT INTERFACE =================
interface PaymentMethod {
    void processPayment();
}

class OnlinePayment implements PaymentMethod {
    private double amount;
    public OnlinePayment(double amount) { this.amount = amount; }

    @Override
    public void processPayment() {
        System.out.printf("Online Payment Successful: Rs. %.2f%n", amount);
    }
}

class CashPayment implements PaymentMethod {
    private double amount;
    public CashPayment(double amount) { this.amount = amount; }

    @Override
    public void processPayment() {
        System.out.printf("Cash on Delivery: Rs. %.2f%n", amount);
    }
}

// ================= EVENT HANDLING INTERFACE =================
interface OrderEventListener {
    void onOrderStatusChanged(int orderId, String status);
}

class EventManager {
    private ArrayList<OrderEventListener> listeners = new ArrayList<>();

    public void addListener(OrderEventListener listener) {
        listeners.add(listener);
    }

    public void notifyListeners(int orderId, String status) {
        for (OrderEventListener listener : listeners) {
            listener.onOrderStatusChanged(orderId, status);
        }
    }
}

class CustomerNotification implements OrderEventListener {
    @Override
    public void onOrderStatusChanged(int orderId, String status) {
        System.out.println("\n[NOTIFICATION]");
        System.out.println("Order ID: " + orderId);
        System.out.println("Status: " + status);
    }
}

// ================= ORDER CLASS =================
class Order {
    private int orderId;
    private Customer customer;

    // COLLECTION
    private ArrayList<FoodItem> items = new ArrayList<>();

    private double total = 0;
    private PaymentMethod payment;

    private EventManager eventManager;
    private Logger logger;

    public Order(int orderId, Customer customer, EventManager eventManager, Logger logger) {
        this.orderId = orderId;
        this.customer = customer;
        this.eventManager = eventManager;
        this.logger = logger;
    }

    public void addItem(FoodItem food) {
        items.add(food);
        total += food.getPrice();
        logger.info(food.getName() + " added to order.");
    }

    public int getOrderId() { return orderId; }
    public String getCustomerName() { return customer.getName(); }
    public ArrayList<FoodItem> getItems() { return items; }
    public double getTotal() { return total; }

    public void setPayment(PaymentMethod payment) { this.payment = payment; }

    public void displayOrder() {
        System.out.println("\n--- ORDER SUMMARY ---");
        System.out.println("Order ID: " + orderId);
        System.out.println("Customer: " + customer.getName());

        for (FoodItem food : items) {
            System.out.printf("%s - Rs. %.2f%n", food.getName(), food.getPrice());
        }
        System.out.printf("Total Amount: Rs. %.2f%n", total);
    }

    public void confirmOrder() {
        if (items.isEmpty()) {
            throw new IllegalStateException("Cannot place an empty order.");
        }
        if (payment == null) {
            throw new IllegalStateException("Payment method not selected.");
        }

        // POLYMORPHISM
        payment.processPayment();

        logger.info("Order " + orderId + " placed successfully.");
        eventManager.notifyListeners(orderId, "Order Placed");
        System.out.println("Order placed successfully!");
    }
}

// ================= FILE HANDLING WITH STRING =================
class OrderFileManager {

    // Builds a receipt as a String and writes it to a text file
    public static void saveReceipt(Order order, String fileName) {
        StringBuilder receipt = new StringBuilder();
        receipt.append("ORDER ID: ").append(order.getOrderId()).append("\n");
        receipt.append("CUSTOMER: ").append(order.getCustomerName().toUpperCase()).append("\n");

        for (FoodItem food : order.getItems()) {
            receipt.append(String.format("%s,%.2f%n", food.getName(), food.getPrice()));
        }
        receipt.append(String.format("TOTAL,%.2f%n", order.getTotal()));

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(fileName))) {
            writer.write(receipt.toString());
            System.out.println("Receipt saved to " + fileName);
        } catch (IOException e) {
            System.out.println("Could not write receipt file.");
        }
    }

    // Reads the receipt back and processes each line using String methods
    public static void readReceipt(String fileName) {
        System.out.println("\n--- RECEIPT FILE CONTENT ---");
        try (BufferedReader reader = new BufferedReader(new FileReader(fileName))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.contains(",")) {
                    String[] parts = line.split(",");
                    System.out.printf("%-12s Rs. %s%n", parts[0], parts[1]);
                } else {
                    System.out.println(line);
                }
            }
        } catch (IOException e) {
            System.out.println("Could not read receipt file.");
        }
    }
}

// ================= DELIVERY THREAD =================
class Delivery extends Thread {
    private int deliveryId;
    private int orderId;
    private String deliveryPerson;

    private EventManager eventManager;
    private Logger logger;

    public Delivery(int deliveryId, int orderId, String deliveryPerson,
                    EventManager eventManager, Logger logger) {
        this.deliveryId = deliveryId;
        this.orderId = orderId;
        this.deliveryPerson = deliveryPerson;
        this.eventManager = eventManager;
        this.logger = logger;
    }

    // THREAD EXECUTION
    @Override
    public void run() {
        try {
            System.out.println("\nDelivery ID: " + deliveryId);
            System.out.println("Delivery Person: " + deliveryPerson);

            String[] statuses = {
                "Order Received", "Food Preparing", "Out for Delivery", "Delivered"
            };

            for (String status : statuses) {
                Thread.sleep(1000);
                System.out.println("\nDelivery Status: " + status);

                // EVENT HANDLING
                eventManager.notifyListeners(orderId, status);

                // LOGGING
                logger.info("Order " + orderId + ": " + status);
            }
        } catch (InterruptedException e) {
            System.out.println("Delivery interrupted.");
            Thread.currentThread().interrupt();
        }
    }
}

// ================= REVIEW =================
class Review {
    private String customerName;
    private String comment;
    private int rating;

    public Review(String customerName, String comment, int rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }
        this.customerName = customerName;
        this.comment = comment;
        this.rating = rating;
    }

    public void displayReview() {
        System.out.println("\n--- CUSTOMER REVIEW ---");
        System.out.println("Customer: " + customerName);
        System.out.println("Rating: " + rating + "/5");
        System.out.println("Comment: " + comment);
    }
}

// ================= ADMIN =================
class Admin extends User {
    public Admin(int id, String name, String address) {
        super(id, name, address);
    }

    @Override
    public void displayDetails() {
        System.out.println("\nAdministrator: " + getName());
        System.out.println("Admin ID: " + getUserId());
    }

    public void manageSystem() {
        System.out.println("Admin is managing the system.");
    }
}

// ================= MAIN CLASS =================
public class Main {
    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        // LOGGING
        Logger logger = Logger.getLogger("FoodOrderingSystem");

        try {
            FileHandler file = new FileHandler("food_order.log", true);
            file.setFormatter(new SimpleFormatter());
            logger.addHandler(file);
            logger.setUseParentHandlers(false);
        } catch (IOException e) {
            System.out.println("Logging file could not be created.");
        }

        try {
            System.out.println("===== ONLINE FOOD ORDERING AND DELIVERY SYSTEM =====");

            System.out.print("Enter customer ID: ");
            int id = sc.nextInt();
            sc.nextLine();

            System.out.print("Enter customer name: ");
            String name = sc.nextLine();

            System.out.print("Enter delivery address: ");
            String address = sc.nextLine();

            Customer customer = new Customer(id, name, address);

            // INHERITANCE AND POLYMORPHISM
            User user = customer;
            user.displayDetails();

            Restaurant restaurant = new Restaurant(101, "Restaurant Owner", "Madurai", "Food Paradise");
            restaurant.displayDetails();
            restaurant.displayMenu();

            // EVENT HANDLING
            EventManager eventManager = new EventManager();
            eventManager.addListener(new CustomerNotification());

            // COLLECTION
            ArrayList<Order> orderHistory = new ArrayList<>();
            Order order = new Order(1001, customer, eventManager, logger);

            // LOOP FOR FOOD SELECTION
            System.out.println("\nEnter 0 to finish ordering.");

            while (true) {
                System.out.print("Enter food item number: ");
                int choice = sc.nextInt();

                if (choice == 0) {
                    break;
                }

                boolean found = false;
                for (FoodItem food : restaurant.getMenu()) {
                    if (food.getFoodId() == choice) {
                        order.addItem(food);
                        System.out.println(food.getName() + " added to cart.");
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    System.out.println("Invalid food item!");
                }
            }

            if (order.getTotal() <= 0) {
                throw new IllegalArgumentException("Please select at least one food item.");
            }

            orderHistory.add(order);
            order.displayOrder();

            // PAYMENT SELECTION
            System.out.println("\n1. Online Payment");
            System.out.println("2. Cash on Delivery");

            System.out.print("Enter payment choice: ");
            int choice = sc.nextInt();

            // INTERFACE AND POLYMORPHISM
            PaymentMethod payment;

            if (choice == 1) {
                payment = new OnlinePayment(order.getTotal());
            } else if (choice == 2) {
                payment = new CashPayment(order.getTotal());
            } else {
                throw new IllegalArgumentException("Invalid payment choice.");
            }

            order.setPayment(payment);
            order.confirmOrder();

            // FILE HANDLING WITH STRING
            OrderFileManager.saveReceipt(order, "order_receipt.txt");
            OrderFileManager.readReceipt("order_receipt.txt");

            // THREAD
            sc.nextLine();

            System.out.print("\nEnter delivery person's name: ");
            String deliveryPerson = sc.nextLine();

            Delivery delivery = new Delivery(501, 1001, deliveryPerson, eventManager, logger);

            System.out.println("\n--- DELIVERY TRACKING ---");
            delivery.start();

            // Wait for delivery thread to finish
            delivery.join();

            // REVIEW
            System.out.print("\nEnter rating (1-5): ");
            int rating = sc.nextInt();
            sc.nextLine();

            System.out.print("Enter your review: ");
            String comment = sc.nextLine();

            Review review = new Review(name, comment, rating);
            review.displayReview();

            // ADMIN
            Admin admin = new Admin(999, "System Admin", "Office");
            admin.displayDetails();
            admin.manageSystem();

            System.out.println("\nTotal Orders: " + orderHistory.size());

            logger.info("Food ordering application completed.");
            System.out.println("\nThank you for using our system!");

        } catch (InputMismatchException e) {
            System.out.println("Error: Please enter the correct data type.");
            logger.warning("Invalid input type.");

        } catch (IllegalArgumentException | IllegalStateException e) {
            System.out.println("Error: " + e.getMessage());
            logger.warning(e.getMessage());

        } catch (InterruptedException e) {
            System.out.println("Main thread interrupted.");
            Thread.currentThread().interrupt();

        } finally {
            sc.close();
        }
    }
}