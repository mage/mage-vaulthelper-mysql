import * as mage from 'mage'
import { ValidatedTopic } from 'mage-validator'
import { query } from './'

/**
 * InvalidVaultForTopicError is triggered when a vault is
 */
class InvalidVaultForTopicError extends mage.MageError {
  constructor(details: any) {
    super({
      code: 'invalid_vault_for_topic',
      details,
      message: 'Requested vault is not attached to requested Topic'
    })
  }
}

/**
 * ValidatedMySQLTopic supplements ValidatedTopic from mage-validator with
 * additional methods to run SQL queries
 */
export class ValidatedMySQLTopic extends ValidatedTopic {
  /**
   * Run a SQL query to retrieve instances
   *
   * @param state
   * @param vaultName
   * @param query
   */
  public static async runSQLQuery(state: mage.core.IState, vaultName: string, sqlQuery: string) {
    const { vaults } = this as any

    if (!vaults[vaultName]) {
      throw new InvalidVaultForTopicError({ vaultName })
    }

    const results = await query(vaultName, sqlQuery)
    return this.parseResults(state, results as any)
  }

  /**
   * Iterate over all results, and turn them into topic instances
   *
   * @param state
   * @param TopicClass
   * @param results
   */
  private static async parseResults(state: mage.core.IState, results: any[]) {
    const promises = results.map(async (data: any) => {
      const { index, value } = this.parseData(data)
      return await this.create(state, index, value)
    })

    return Promise.all(promises)
  }

  /**
   * Parse the data
   *
   * Separate index data from values.
   *
   * @param TopicClass
   * @param data
   */
  private static parseData(data: any) {
    const value = JSON.parse(data.value)
    const index: any = {}
    this.index.forEach((key: string) => {
      index[key] = data[key]
    })

    return { index, value }
  }
}
