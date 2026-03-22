# Inventory System (Flat Readiness and Inventory Control)

## Purpose
This system exists to keep each flat operationally ready, not just to count stock.
It must support:
- inventory catalog
- flat-level inventory control
- consumables control
- readiness determination inputs
- operational alerting
- booking influence through readiness plus manual availability blocks

## Scope For This Phase
- Inventory catalog and categorization
- Template-based baseline setup per flat type
- Flat-level expected vs current inventory tracking
- Stock movement tracking
- Alert generation inputs
- Readiness data inputs for the readiness service

## Item Categories
- `asset`
- `consumable`
- `maintenance_supply`

Category intent:
- `asset`: durable items (for example TV, AC unit, mattress, kettle).
- `consumable`: fast-moving replenishable items (for example toiletries, tissue, water).
- `maintenance_supply`: operational maintenance items (for example bulbs, filters, cleaning chemicals).

## Core Inventory Concepts

### 1) Inventory Catalog
Global list of inventory items with reusable metadata.

Suggested fields:
- `id`
- `sku` (optional for internal operations, recommended)
- `name`
- `category`
- `unit` (piece, pack, liter, etc.)
- `is_critical` (for readiness impact)
- `reorder_threshold` (optional for alerting)
- `is_active`
- `created_at`
- `updated_at`

### 2) Inventory Templates (By Flat Type)
Reusable standards for what a flat type should have.

Template model direction:
- `inventory_template`
- `inventory_template_item`

Template item direction:
- `template_id`
- `inventory_item_id`
- `expected_quantity`
- `is_required`
- `condition_expectation` (optional later)

Notes:
- Templates are defaults, not hard locks.
- Flats can inherit template targets and later support per-flat overrides.

### 3) Flat Inventory
Tracks expected inventory versus current observed inventory for each flat.

Suggested assignment fields:
- `flat_id`
- `inventory_item_id`
- `expected_quantity`
- `current_quantity`
- `missing_quantity`
- `damaged_quantity`
- `condition_status` (`ok`, `missing`, `damaged`, `needs_replacement`)
- `last_checked_at`
- `updated_by` (optional actor placeholder)
- `created_at`
- `updated_at`

## Stock Movements
Every stock change should be traceable as an explicit movement.

Supported movement types:
- `add`
- `deduct`
- `consume`
- `adjust`
- `damage`
- `replace`
- `transfer`

Suggested movement fields:
- `id`
- `inventory_item_id`
- `movement_type`
- `quantity`
- `from_scope` (`central`, `flat`, `external`)
- `from_ref_id` (nullable)
- `to_scope` (`central`, `flat`, `external`)
- `to_ref_id` (nullable)
- `reason`
- `notes`
- `actor_id` (placeholder for protected operations)
- `created_at`

Rules:
- Quantities must be positive for movement records.
- `transfer` captures movement between central stock and flat stock.
- `replace` should preserve audit history rather than deleting damaged records.

## Central Stock vs Flat-Assigned Stock
Both concepts are first-class:
- Central stock: pooled storage inventory.
- Flat-assigned stock: inventory currently allocated to a specific flat.

Operational direction:
- Support transfer movements between central and flat-assigned stock.
- Flat readiness should evaluate flat-assigned state, not only central availability.

## Alert Inputs
This phase supports readiness-oriented alerts:
- low stock
- missing required item
- damaged critical asset
- readiness-impacting issue

Alert records may include:
- `flat_id` (nullable when central-only)
- `inventory_item_id` (nullable for broader readiness issues)
- `alert_type`
- `severity` (`critical`, `important`, `minor`)
- `status` (`open`, `acknowledged`, `resolved`)
- `message`
- `created_at`
- `updated_at`

## Service Boundaries
- Inventory services manage catalog, flat assignments, and stock movements.
- Readiness service derives flat readiness from inventory + maintenance + housekeeping signals.
- Booking services should consume readiness outcomes through explicit integration boundaries, never by direct inventory writes.

## Booking Influence (High-Level)
- Inventory does not directly mutate reservation statuses.
- Inventory/readiness outcomes can trigger operational warnings.
- Critical operational failures should trigger or recommend manual availability blocks.
- Availability truth remains calendar-block-driven and flat-specific.

## Non-Goals For This Phase
- Procurement
- Vendor/supplier management
- Purchase orders
- Full housekeeping product
- Accounting integrations
