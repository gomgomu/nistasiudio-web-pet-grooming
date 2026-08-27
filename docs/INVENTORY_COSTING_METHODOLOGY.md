# Inventory Costing Methodology — PetFlow SaaS

## 1. Overview

This document specifies the costing rules, valuation models, and gross profit formulas implemented in the PetFlow Inventory Engine for Thai veterinary clinics, pet hospitals, and grooming businesses.

In pet healthcare and retail, accurate inventory costing is critical for:
- Evaluating clinical pharmacy drug valuations.
- Preventing financial distortions caused by supplier price fluctuations.
- Determining true gross profit margins per service and retail product.
- Compliance with Thai accounting standards (TFRS for NPAEs / TAS 2 Inventory).

---

## 2. Moving Weighted Average Cost (MAC)

PetFlow standardizes on **Moving Weighted Average Cost (MAC)** as the primary continuous inventory valuation method.

### 2.1 Mathematical Formulation

Whenever a new batch of stock is received (via Supplier Purchase Order, Initial Balance, or Lot Registration):

$$\bar{C}_{\text{new}} = \frac{(S_{\text{existing}} \times \bar{C}_{\text{existing}}) + (Q_{\text{received}} \times C_{\text{received}})}{S_{\text{existing}} + Q_{\text{received}}}$$

Where:
- $S_{\text{existing}}$ = Existing stock on hand before receipt.
- $\bar{C}_{\text{existing}}$ = Current weighted average unit cost (in integer Satang).
- $Q_{\text{received}}$ = Quantity of incoming goods.
- $C_{\text{received}}$ = Unit purchase cost of incoming goods (in integer Satang).
- $\bar{C}_{\text{new}}$ = Updated moving weighted average unit cost.

### 2.2 Inventory Deductions (Sales, Grooming Consumption & Waste)

When stock is issued or deducted:
- **POS Sale (`OUT`)**:
  $$\text{COGS} = Q_{\text{sold}} \times \bar{C}$$
  $\bar{C}$ remains unchanged.
- **Clinic / Grooming Consumption (`CONSUMPTION`)**:
  $$\text{Service Cost} = Q_{\text{consumed}} \times \bar{C}$$
  $\bar{C}$ remains unchanged.
- **Damage / Expiry Write-Off (`WASTE`)**:
  $$\text{Loss} = Q_{\text{wasted}} \times \bar{C}$$
  $\bar{C}$ remains unchanged.
- **Zero Stock Edge Case**:
  If stock on hand drops to $\le 0$, the last recorded $\bar{C}$ is preserved as the standard baseline until new purchase receipts arrive.

---

## 3. Financial Units & Precision Standards

- **Satang Representation**:
  All financial amounts (unit costs, sale prices, line totals, valuations, COGS, gross profits) are strictly computed and stored as **integer minor units** (`BigInt` Satang, where $100\text{ satang} = 1.00\text{ THB}$).
- **No Floating-Point Arithmetic**:
  Division operations are rounded to the nearest integer satang using standard bankers/half-up rounding (`Math.round`), eliminating floating-point imprecision.

---

## 4. Gross Profit & Margin Metrics

### 4.1 Unit Gross Margin
$$\text{Gross Profit (Satang)} = \text{Sale Price (Satang)} - \text{Unit Cost (Satang)}$$
$$\text{Gross Margin (\%)} = \frac{\text{Sale Price} - \text{Unit Cost}}{\text{Sale Price}} \times 100$$

### 4.2 Total Portfolio Asset Valuation
$$\text{Total Asset Valuation (Satang)} = \sum_{i=1}^{N} \Big(S_{i} \times \bar{C}_{i}\Big)$$
$$\text{Total Potential Revenue (Satang)} = \sum_{i=1}^{N} \Big(S_{i} \times P_{i}\Big)$$
$$\text{Total Potential Gross Profit (Satang)} = \text{Total Potential Revenue} - \text{Total Asset Valuation}$$

---

## 5. Costing Methods Supported in Reports

| Method Key | Description | Use Case |
| :--- | :--- | :--- |
| `MOVING_AVERAGE` (Default) | Weighted average cost across historic purchases | Standard financial reporting & tax compliance |
| `LATEST_COST` | Most recent supplier purchase price | Replacement cost planning & price adjustment analysis |
| `MASTER_COST` | Product catalog standard cost baseline | Budgeting & baseline quotation |
