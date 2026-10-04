from app.models import BoardData

DEFAULT_BOARD_TITLE = "Acquisitions Pipeline"


def _card(id, title, details, property_type, market, size_sf, price, cap_rate):
    return {
        "id": id,
        "title": title,
        "details": details,
        "property_type": property_type,
        "market": market,
        "size_sf": size_sf,
        "price": price,
        "cap_rate": cap_rate,
    }


# Sample deals are fictional, for demo purposes only.
DEFAULT_BOARD = BoardData.model_validate(
    {
        "columns": [
            {"id": "col-sourcing", "title": "Sourcing", "cardIds": ["deal-1", "deal-2"]},
            {"id": "col-underwriting", "title": "Underwriting", "cardIds": ["deal-3", "deal-4"]},
            {"id": "col-loi", "title": "LOI", "cardIds": ["deal-5"]},
            {"id": "col-diligence", "title": "Due Diligence", "cardIds": ["deal-6"]},
            {"id": "col-closed", "title": "Closed", "cardIds": ["deal-7", "deal-8"]},
        ],
        "cards": {
            c["id"]: c
            for c in [
                _card("deal-1", "Riverbend Logistics Center", "Off-market bulk distribution, 36' clear. Broker tour scheduled.", "Industrial", "Dallas-Fort Worth", 412000, 58500000, 5.6),
                _card("deal-2", "Magazine St Retail Strip", "Grocery-adjacent neighborhood strip, 92% leased.", "Retail", "New Orleans", 18500, 6200000, 7.1),
                _card("deal-3", "Northlake Flex Park", "Small-bay flex, below-market rents rolling in 2027.", "Industrial", "Houston", 96000, 14800000, 6.4),
                _card("deal-4", "Peachtree Medical Office", "Hospital-affiliated MOB, 7-yr WALT. Pull rent roll.", "Medical Office", "Atlanta", 64000, 27000000, 6.9),
                _card("deal-5", "Cypress Self Storage", "Class A climate-controlled, lease-up stage.", "Self Storage", "Tampa", 82000, 11300000, 6.0),
                _card("deal-6", "Gateway Data Hall", "Powered shell, 18 MW utility commitment. Phase I ESA ordered.", "Data Center", "Phoenix", 120000, 96000000, 6.2),
                _card("deal-7", "Harbor Point Apartments", "312-unit Class A, closed with agency debt.", "Multifamily", "Jersey City", 210000, 88000000, 4.9),
                _card("deal-8", "Mid-City Industrial Infill", "Last-mile infill, 100% leased to two tenants.", "Industrial", "Chicago", 140000, 19600000, 6.1),
            ]
        },
    }
)
