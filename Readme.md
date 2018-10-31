# mage-vaulthelper-mysql

Accessing vault backends directly is generally considered
to be tedious in MAGE. This will help you by creating
object instances to access Couchbase directly, so that you may
do SQL calls.

## Installation

```shell
npm install --save mage-vaulthelper-mysql
```

## Usage

### Managing table schema

This helpers provides methods to quickly create both topic tables and custom tables.

> ./lib/archivist/migrations/vaultName/0.0.1.ts

```typescript
import * as mysql from 'mage-vaulthelper-mysql'

// List topics with their indexes
const topics = {
  auth: ['username']
}

export const up = (vault: any, cb: any) => mysql.createTopicTables(vault, topics).then(cb).catch(cb)
export const down = (vault: any, cb: any) => mysql.dropTopicTables(vault, topics).then(cb).catch(cb)
```

> ./lib/archivist/migrations/anotherVaultName/0.0.1.ts

```typescript
import * as mysql from 'mage-vaulthelper-mysql'

// List topics with their indexes
const tables = {
  Ranking: [
    { name: 'userId', type: 'VARCHAR(36)', pk: true },
    { name: 'rank', type: 'SMALLINT' },
  ]
};


export const up = (vault: any, cb: any) => mysql.createTables(vault, tables).then(cb).catch(cb)
export const down = (vault: any, cb: any) => mysql.dropTables(vault, tables).then(cb).catch(cb)
```

### Making queries

You can connect to the vaults directly to run queries as needed.

> example code

```typescript
interface ICount { count: number }
type CountList = ICount[]
const [{ count }]  = await query<CountList>(this.vault, `
  SELECT COUNT(*) AS count FROM SomeTable'
`)
```

### Integration with mage-validator

If you are using `mage-validator`, you can use the `ValidatedMySQLTopic` to
do custom read queries and have the output be converted into topic instances.

> ./lib/modules/user/topics/User.ts

```typescript
import ValidatedMySQLTopic from 'mage-vaulthelper-mysql/ValidatedMySQLTopic`

class Index {
  public userId: string
}

export default class User extends ValidatedMySQLTopic {
  // Index configuration
  public static index = ['userId']
  public static indexType = Index

  // Vaults configuration (optional)
  public static vaults = {
    userVault: {}
  }

  public date: number = Date.now()
}
```

> ./lib/modules/user/index.ts

```typescript
import * as mage from 'mage'
import UserTopic from `./topics/User`

class UserModule {
  public async example(state: mage.core.IState) {
    const users = await UserTopic.runSQLQuery(state, 'userVault', `
      SELECT * from User ORDER BY JSON_EXTRACT(value, "$.date")
    `)

    console.log(users)
  }
}

export default new UserModule()
```

## License

MIT
