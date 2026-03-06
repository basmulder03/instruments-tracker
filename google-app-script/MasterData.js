function addPerson(payload) {
  return addEntity_('People', 'PersonId', payload, {
    entityType: 'PERSON',
    idPrefix: 'PER',
    nameKey: 'Naam',
    extraFields: ['Notes']
  });
}

function addLocation(payload) {
  return addEntity_('Locations', 'LocationId', payload, {
    entityType: 'LOCATION',
    idPrefix: 'LOC',
    nameKey: 'Naam',
    extraFields: ['Adres','Notes']
  });
}

function addInstrument(payload) {
  return addEntity_('Instruments', 'InstrumentId', payload, {
    entityType: 'INSTRUMENT',
    idPrefix: 'INS',
    nameKey: 'Naam',
    extraFields: [
      'Type','Merk','Serienummer','PurchaseDate','PurchaseCost','UsefulLifeYears','SalvageValue',
      'CurrentStatus','CurrentLocationId','CurrentPersonId','Notes'
    ],
    defaults: {
      CurrentStatus: 'IN_STORAGE'
    }
  });
}

function getMasterData() {
  return {
    people: getSimpleList_('People', 'PersonId', 'Naam'),
    locations: getSimpleList_('Locations', 'LocationId', 'Naam'),
    instruments: getSimpleList_('Instruments', 'InstrumentId', 'Naam')
  };
}
