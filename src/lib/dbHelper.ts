import * as squel from 'squel'

interface Field {
  name: string
  type: string
  options: string[]
}

interface DerivedKeyOptions {
  encryptedWif: string
  path: string
  entropySource: string
  keyType: string
}

interface PersonaOptions {
  did: string
  controllingKey: string
}

export interface TableOptions {
  name: string
  fields: Field[]
}

export interface AssembledQuery {
  text: string
  values?: string[]
}

export const dbHelper = {
  defaultTables: [{
    name: 'Personas',
    fields: [{
      name: 'did',
      type: 'VARCHAR(75)',
      options: ['PRIMARY KEY']
    }, {
      name: 'controllingKey',
      type: 'VARCHAR(110)',
      options: ['NOT NULL', 'UNIQUE']
    }, {
      name: 'FOREIGN KEY(controllingKey)',
      type: 'REFERENCES Keys(encryptedWif)',
      options: []
    }]
  }, {
    name: 'Keys',
    fields: [{
      name: 'encryptedWif',
      type: 'VARCHAR(110)',
      options: ['PRIMARY KEY']
    }, {
      name: 'path',
      type: 'TEXT',
      options: ['NOT NULL']
    }, {
      name: 'entropySource',
      type: 'VARCHAR(100)',
      options: ['NOT NULL']
    }, {
      name: 'keyType',
      type: 'TEXT',
      options: ['NOT NULL']
    }, {
      name: 'FOREIGN KEY(entropySource)',
      type: 'REFERENCES MasterKeys(encryptedEntropy)',
      options: []
    }]
  }, {
    name: 'MasterKeys',
    fields: [{
      name: 'encryptedEntropy',
      type: 'VARCHAR(100)',
      options: ['PRIMARY KEY']
    }, {
      name: 'timestamp',
      type: 'DATE',
      options: ['NOT NULL']
    }]
  }],

  createTableQuery: (options: TableOptions) : AssembledQuery => {
    const { name, fields } = options
    const st = `CREATE TABLE IF NOT EXISTS ${name}`

    const fieldSt = fields.map(f => {
      const { name, type, options } = f
      const fieldOptions = options.join(' ')
      return `${name} ${type} ${fieldOptions}`
    }).join(', ')
    return { text: `${st} (${fieldSt})` }
  },

  addPersonaQuery: ({ did, controllingKey }: PersonaOptions) : AssembledQuery => {
    return squel.insert()
      .into('Personas')
      .setFields({
        did: did,
        controllingKey: controllingKey
      })
      .toParam()
  },

  addDerivedKeyQuery: (options: DerivedKeyOptions) : AssembledQuery => {
    const { encryptedWif, path, entropySource, keyType } = options
    return squel.insert()
      .into('Keys')
      .setFields({
        encryptedWif: encryptedWif,
        path: path,
        entropySource: entropySource,
        keyType: keyType
      })
      .toParam()
  },

  addMasterKeyQuery: (encryptedEntropy: string) : AssembledQuery => {
    return squel.insert()
      .into('MasterKeys')
      .setFields({
        encryptedEntropy: encryptedEntropy,
        timestamp: Date.now()
      })
      .toParam()
  },

  getPersonasQuery: () : AssembledQuery => {
    return squel.select()
      .from('Personas')
      .toParam()
  }
}
