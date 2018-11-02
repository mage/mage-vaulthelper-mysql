import * as mage from 'mage'
import * as mysql from 'mysql'

/**
 * Format for parameters
 */
export interface IQueryParams {
  fieldName: string
  value: any
  comparator: string
  isNotJsonParam?: boolean
}


/**
 * VaultNotFoundError is triggered when a vault is
 */
class VaultNotFoundError extends mage.MageError {
  constructor(details: any) {
    super({
      code: 'vault_not_found',
      details,
      message: 'Requested vault could not be found'
    })
  }
}

/**
 *
 * @param vault
 * @param tables
 */
export async function createTables(vault: any, tables: any) {
  for (const [tableName, schema] of Object.entries(tables)) {
    await createTable(vault, tableName, schema)
  }
}

/**
 *
 * @param vault
 * @param tableName
 * @param schema
 */
export async function createTable(vault: any, tableName: string, schema: any) {
  return new Promise((resolve, reject) => {
    vault.createTable(tableName, schema, (error?: Error) => {
      if (error) {
        return reject(error)
      }

      resolve()
    })
  })
}

/**
 *
 * @param vault
 * @param topics
 */
export async function createTopicTables(vault: any, topics: { [key: string]: string[] }) {
  for (const [name, index] of Object.entries(topics)) {
    await createTopicTable(vault, name, index)
  }
}

/**
 *
 * @param vault
 * @param name
 * @param index
 */
export async function createTopicTable(vault: any, name: string, index: string[]) {
  const columns = index.map((field, pos) => ({
    name: field,
    type: 'VARCHAR(36) NOT NULL UNIQUE',
    pk: pos === 0
  }))

  columns.push({ name: 'value', type: 'LONGTEXT', pk: false })
  columns.push({ name: 'mediaType', type: 'VARCHAR(40)', pk: false })

  await createTable(vault, name, columns)
}

/**
 *
 * @param vault
 * @param topics
 */
export async function dropTopicTables(vault: any, topics: { [key: string]: string[] }) {
  for (const name of Object.keys(topics)) {
    await dropTopicTable(vault, name)
  }
}

/**
 *
 * @param vault
 * @param name
 * @param index
 */
export async function dropTopicTable(vault: any, name: string) {
  await dropTable(vault, name)
}

/**
 *
 * @param vault
 * @param tables
 */
export async function dropTables(vault: any, tables: any) {
  for (const tableName of Object.keys(tables)) {
    await dropTable(vault, tableName)
  }
}

/**
 *
 * @param vault
 * @param tableName
 */
export async function dropTable(vault: any, tableName: string) {
  return new Promise((resolve, reject) => {
    vault.dropTable(tableName, (error?: Error) => {
      if (error) {
        return reject(error)
      }

      resolve()
    })
  })
}

/**
 *
 * @param params
 */
export function constructWhereFromParams(params: IQueryParams[]): string {
  if (!params.length) {
    return ''
  }

  let whereStatement = 'WHERE'
  for (const param of params) {
    // if string, wrap around with single quote
    let valueStr = param.value

    if (typeof valueStr === 'string') {
      valueStr = `'${param.value}'`
    }

    if (whereStatement !== 'WHERE') {
      whereStatement += ' and'
    }

    if (param.isNotJsonParam) {
      if (param.comparator.toUpperCase() === 'LIKE') {
        whereStatement += ` LOWER(${param.fieldName}) ${param.comparator} LOWER(${valueStr})`
      } else {
        whereStatement += ` ${param.fieldName} ${param.comparator} ${valueStr}`
      }
    } else {
      if (param.comparator.toUpperCase() === 'LIKE') {
        whereStatement += ` LOWER(JSON_EXTRACT(value, "$.${param.fieldName}")) ${param.comparator} LOWER(${valueStr})`
      } else {
        whereStatement += ` JSON_EXTRACT(value, "$.${param.fieldName}") ${param.comparator} ${valueStr}`
      }
    }
  }

  return whereStatement
}

/**
 * Validate that the requested vault is present, assigned to the
 * associated topic, and return its client object.
 *
 * @param TopicClass
 * @param vaultName
 */
export function getVaultClient(vaultName: string): mysql.Pool {
  const { archivist } = mage.core
  const persistentVaults = archivist.getPersistentVaults()
  const vault = persistentVaults[vaultName]

  if (!vault) {
    throw new VaultNotFoundError({ vaultName })
  }

  return vault.pool
}

/**
 *
 * @param vaultName
 * @param queryString
 */
export async function query<T>(vault: any, queryString: string): Promise<T> {
    const client = typeof vault === 'string' ? getVaultClient(vault) : vault as mysql.Pool

    return new Promise<T>((resolve, reject) => {
      client.query(queryString, (error, results) => {
        if (error) {
          return reject(error)
        }

        resolve(results)
      })
    })
}
