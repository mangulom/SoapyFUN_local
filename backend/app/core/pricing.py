"""Pure, auditable pricing calculations. All monetary input is Decimal."""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class PriceBreakdown:
    unit_cost: Decimal
    selling_price: Decimal
    commission: Decimal
    tax: Decimal
    profit: Decimal
    margin: Decimal


def calculate_price(
    unit_cost: Decimal,
    markup_percent: Decimal,
    commission_percent: Decimal = Decimal("0"),
    tax_percent: Decimal = Decimal("0"),
) -> PriceBreakdown:
    """Compute a marked-up price grossed up for percentage fees and taxes.

    `markup_percent` is a markup over cost, not a margin over sale price.
    Tax is modeled as a percentage of selling price for this generic estimator;
    local tax rules must be configured and verified before production use.
    """
    if unit_cost < 0:
        raise ValueError("unit_cost cannot be negative")
    if markup_percent < 0 or commission_percent < 0 or tax_percent < 0:
        raise ValueError("percentages cannot be negative")
    retained = Decimal("1") - (commission_percent + tax_percent) / Decimal("100")
    if retained <= 0:
        raise ValueError("commission and tax must total less than 100%")

    desired_profit = unit_cost * markup_percent / Decimal("100")
    price = money((unit_cost + desired_profit) / retained)
    commission = money(price * commission_percent / Decimal("100"))
    tax = money(price * tax_percent / Decimal("100"))
    profit = money(price - unit_cost - commission - tax)
    margin = (profit / price * Decimal("100")) if price else Decimal("0")
    return PriceBreakdown(
        unit_cost=money(unit_cost),
        selling_price=price,
        commission=commission,
        tax=tax,
        profit=profit,
        margin=margin.quantize(CENT, rounding=ROUND_HALF_UP),
    )
