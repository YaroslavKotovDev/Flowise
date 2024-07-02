// import * as ZOHOCRMSDK from 'node_modules/@zohocrm/nodejs-sdk-6.0/lib/index'
import * as ZOHOCRMSDK from '@zohocrm/nodejs-sdk-6.0'

// const { UserSignature } = require('@zohocrm/nodejs-sdk-6.0/lib/routes/user_signature')
// const { USDataCenter } = require('@zohocrm/nodejs-sdk-6.0/lib/routes/dc/us_data_center')
// const { EUDataCenter } = require('@zohocrm/nodejs-sdk-6.0/lib/routes/dc/eu_data_center')
// const { FileStore } = require('@zohocrm/nodejs-sdk-6.0/lib/models/authenticator/store/file_store')
// const { SDKConfigBuilder } = require('@zohocrm/nodejs-sdk-6.0/lib/routes/sdk_config_builder')
// const { InitializeBuilder } = require('@zohocrm/nodejs-sdk-6.0/lib/routes/initialize_builder')
// const { OAuthBuilder } = require('@zohocrm/nodejs-sdk-6.0/lib/models/authenticator/oauth_builder')

const ZOHO_API_USER_EMAIL = 'v.samardak2017@gmail.com'
const ZOHO_API_CLIENT_ID = '1000.U234V45MDYIP1VOKJGQ223016RZGOV'
const ZOHO_API_CLIENT_SECRET = '2453250914955524795e507b21910ecd3343091f9a'
const ZOHO_API_CLIENT_REFRESH_TOKEN = '1000.1fcf41a7b3f0d550105e3f880737c2db.7d6bd2dd1bfcba75f58d4c6e54a4e7a1'
const ZOHO_API_CLIENT_TOKEN_PATH = 'C:/Work/Flowise/tmp/nodejs_sdk_tokens.1000.U234V45MDYIP1VOKJGQ223016RZGOV.txt'

// const ZOHO_API_USER_EMAIL = 'm.rudnev@solutionmentors.org'
// const ZOHO_API_CLIENT_ID = '1000.6WT2Z55D4DYIX9WS3Z3C4XM08V3CWB'
// const ZOHO_API_CLIENT_SECRET = '465cdd5ddef07ad70c09ad58dc8116d865e3e92e6a'
// const ZOHO_API_CLIENT_REFRESH_TOKEN = '1000.cea7a9d3967156a9b8b1aac5e8dffb1e.914a07bc95d60daebc7bcdcaec94e7dd'
// const ZOHO_API_CLIENT_TOKEN_PATH = 'C:/Work/Flowise/tmp/nodejs_sdk_tokens.1000.6WT2Z55D4DYIX9WS3Z3C4XM08V3CWB.txt'

async function initialize() {
    let user = new ZOHOCRMSDK.UserSignature(ZOHO_API_USER_EMAIL)
    let environment = ZOHOCRMSDK.EUDataCenter.PRODUCTION()
    let token = new ZOHOCRMSDK.OAuthBuilder()
        .clientId(ZOHO_API_CLIENT_ID)
        .clientSecret(ZOHO_API_CLIENT_SECRET)
        .refreshToken(ZOHO_API_CLIENT_REFRESH_TOKEN)
        .build()
    let tokenstore = new ZOHOCRMSDK.FileStore(ZOHO_API_CLIENT_TOKEN_PATH)
    let sdkConfig = new ZOHOCRMSDK.SDKConfigBuilder().pickListValidation(false).autoRefreshFields(true).build()
    try {
        ;(await new ZOHOCRMSDK.InitializeBuilder())
            .user(user)
            .environment(environment)
            .token(token)
            .store(tokenstore)
            .SDKConfig(sdkConfig)
            .initialize()
    } catch (error) {
        console.error(error)
    }
}

module.exports = { initialize }
