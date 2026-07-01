# Project Goal

We are repurposing the existing **PrimeTrax (G-Trax)** desktop POS system into a **restaurant POS system** for a real client.

This is **not** a new project. It is a transformation of the existing application.

PrimeTrax already has a solid architecture, offline support, POS functionality, inventory management, receipt printing, customers, expenses, dashboards, Electron packaging, and licensing. I want to reuse as much of that work as possible instead of rebuilding everything.

Your first task is to **analyze the existing codebase** and identify which parts can be reused, simplified, modified, or removed for a restaurant environment.

Do not start making changes immediately. First understand the architecture and create an implementation plan.

---

# About the Client

The client owns a **small fast food restaurant in Pakistan**.

He is not technical.

His expectation is simple:

> "I don't know what features I need. I just want a POS that gets the job done."

The software should therefore prioritize:

* Simplicity
* Speed
* Reliability
* Large touch-friendly controls
* Minimal training required

Avoid unnecessary enterprise complexity.

---

# Overall Design Philosophy

The application should feel like a modern commercial restaurant POS.

Take inspiration from Odoo POS for:

* overall workflow
* layout
* cashier experience
* clean UI
* large buttons
* minimal clicks

Do **not** copy Odoo's code.

Use it only as UX inspiration.

---

# Main Objective

Transform PrimeTrax from an electronics-oriented POS into a restaurant POS while preserving the existing architecture wherever possible.

Reuse existing systems whenever it makes sense instead of rewriting them.

---

# Existing Features to Evaluate

Analyze each existing feature and decide whether it should be:

* reused without modification
* simplified
* modified
* hidden
* removed

Examples include:

* POS
* Products
* Inventory
* Customers
* Expenses
* Dashboard
* Reports
* Receipt Printing
* Credits
* Purchases
* Serial Number Tracking
* Warranty
* RMA
* Licensing

The goal is to keep the project clean and focused on restaurant operations.

---

# Restaurant Requirements

The restaurant mainly sells:

* Burgers
* Pizza
* Sandwiches
* Shawarma
* Fries
* Drinks

Most sales are **Deals/Combos**, not individual items.

Example:

Deal 1

* Zinger Burger
* Fries
* Drink

Deal 2

* Large Pizza
* 2 Drinks

Deals should be treated as first-class entities inside the system, not as an afterthought.

Design a clean and maintainable way to manage them.

---

# POS Experience

The POS screen is the heart of the application.

Redesign it completely.

Desired workflow:

* Categories on one side
* Large product/deal buttons
* Current order clearly visible
* Quantity controls
* Discounts
* Checkout
* Payment
* Receipt

Everything should require as few clicks as possible.

Optimize for touch screens.

The cashier should be able to complete an order within seconds.

---

# Checkout

Support:

* Cash
* Card

The client specifically requested a **discount for card holders**.

Implement this in a flexible way rather than hardcoding values.

The discount should be configurable from settings.

---

# Receipt Printing

The client wants thermal receipt printing.

Improve the current receipt template so it is suitable for an 80mm thermal printer.

Include:

* Restaurant Name
* Invoice Number
* Date & Time
* Cashier
* Ordered Items
* Deals
* Discount
* Total
* Payment Method
* Thank You Message

Ensure the print layout is professional.

---

# Dashboard

Replace hardware-focused analytics with restaurant-focused information.

Examples:

* Today's Sales
* Orders Today
* Revenue
* Top Selling Products
* Top Selling Deals
* Payment Method Breakdown
* Recent Orders

Keep the dashboard useful but not overwhelming.

---

# Product Management

Restaurant products are much simpler than electronics.

Products should support:

* Name
* Category
* Price
* Cost
* Stock
* Image

There should also be support for:

* Deals
* Combo Offers

Avoid unnecessary fields that are specific to electronics.

---

# Customers

Support:

* Walk-in Customer
* Registered Customer
* Phone Number
* Notes

Keep it lightweight.

---

# Expenses

The existing expense system is already useful.

Adapt it for restaurant expenses such as:

* Rent
* Salaries
* Utilities
* Ingredients
* Maintenance

Reuse the existing implementation wherever possible.

---

# Reports

Generate practical reports including:

* Daily Sales
* Weekly Sales
* Monthly Sales
* Best Selling Products
* Best Selling Deals
* Expenses
* Profit

---

# UI/UX

The UI should feel modern and premium.

Use the existing design system where appropriate, but redesign pages that are currently tailored for electronics.

Focus heavily on usability.

The application should look like commercial software, not an admin panel.

---

# Code Quality Expectations

Before making changes:

1. Analyze the existing architecture.
2. Explain what will be reused.
3. Explain what should be removed.
4. Explain what should be redesigned.

Then implement the project incrementally.

Avoid unnecessary rewrites.

Reuse existing components and business logic wherever possible.

Refactor instead of duplicating code.

Maintain clean architecture throughout the implementation.

Whenever you are uncertain about a design decision, prefer maintainability, simplicity, and real-world usability over adding more features.
