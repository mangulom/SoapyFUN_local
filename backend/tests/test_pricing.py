from decimal import Decimal

import pytest

from app.core.pricing import calculate_price


def test_price_breakdown_is_reproducible() -> None:
    result = calculate_price(Decimal("10"), Decimal("100"), Decimal("10"), Decimal("18"))
    assert result.selling_price == Decimal("27.78")
    assert result.commission == Decimal("2.78")
    assert result.tax == Decimal("5.00")
    assert result.profit == Decimal("10.00")


@pytest.mark.parametrize(
    "values",
    [
        (Decimal("-1"), Decimal("10"), Decimal("0"), Decimal("0")),
        (Decimal("1"), Decimal("-1"), Decimal("0"), Decimal("0")),
        (Decimal("1"), Decimal("10"), Decimal("70"), Decimal("30")),
    ],
)
def test_invalid_pricing_inputs_are_rejected(values: tuple[Decimal, Decimal, Decimal, Decimal]) -> None:
    with pytest.raises(ValueError):
        calculate_price(*values)
