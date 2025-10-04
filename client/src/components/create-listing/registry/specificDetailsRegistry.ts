export function getFieldsForSubcategory(subcategoryId: string): string[] {
  switch (subcategoryId) {
    case "voiture":
    case "utilitaire":
      return [
        "brand",
        "model",
        "year",
        "mileage",
        "fuelType",
        "transmission",
        "vehicleType",
        "power",
        "displacement",
        "doors",
        "color",
        "upholstery",
        "emissionClass",
        "equipment",
      ];

    case "moto":
    case "scooter":
      return [
        "brand",
        "model",
        "year",
        "mileage",
        "motorcycleType",
        "displacement",
        "power",
        "color",
        "licenseType",
      ];

    case "quad":
      return [
        "brand",
        "model",
        "year",
        "mileage",
        "quadType",
        "displacement",
        "power",
      ];

    case "caravane":
      return ["brand", "model", "year", "caravanType", "sleeps", "length"];

    case "remorque":
      return ["trailerType", "capacity", "dimensions"];

    case "bateau":
      return [
        "brand",
        "model",
        "year",
        "boatType",
        "length",
        "motorPower",
        "mooringPort",
      ];

    case "jetski":
      return ["brand", "model", "year", "power", "hoursUsed"];

    case "aerien":
      return [
        "brand",
        "model",
        "year",
        "aircraftType",
        "flightHours",
        "engineType",
      ];

    case "piece-voiture":
    case "piece-moto":
    case "autre-piece":
      return [
        "partCategory",
        "partCondition",
        "brand",
        "compatibleModels",
        "reference",
      ];

    case "reparation":
    case "remorquage":
    case "entretien":
    case "autre-service":
      return ["serviceType", "serviceArea", "availability", "certifications"];

    default:
      return [];
  }
}

export function getRequiredFields(subcategoryId: string): string[] {
  switch (subcategoryId) {
    case "voiture":
      return [
        "brand",
        "model",
        "year",
        "mileage",
        "fuelType",
        "transmission",
        "vehicleType",
      ];

    case "utilitaire":
      return [
        "brand",
        "model",
        "year",
        "mileage",
        "fuelType",
        "transmission",
        "utilityType",
      ];

    case "moto":
    case "scooter":
      return ["brand", "model", "year", "mileage", "motorcycleType"];

    case "caravane":
      return ["brand", "model", "year", "caravanType", "sleeps"];

    case "remorque":
      return ["trailerType"];

    case "bateau":
      return ["brand", "model", "year", "boatType", "length"];

    case "piece-voiture":
    case "piece-moto":
    case "autre-piece":
      return ["partCategory", "partCondition"];

    case "reparation":
    case "remorquage":
    case "entretien":
    case "autre-service":
      return ["serviceType", "serviceArea"];

    default:
      return [];
  }
}
