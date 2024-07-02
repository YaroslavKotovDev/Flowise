// Env: DEV

const { UserSignature } = require('@zohocrm/nodejs-sdk-2.0/routes/user_signature')
const { USDataCenter } = require('@zohocrm/nodejs-sdk-2.0/routes/dc/us_data_center')
const { OAuthBuilder } = require('@zohocrm/nodejs-sdk-2.0/models/authenticator/oauth_builder')
const { FileStore } = require('@zohocrm/nodejs-sdk-2.0/models/authenticator/store/file_store')
const { SDKConfigBuilder } = require('@zohocrm/nodejs-sdk-2.0/routes/sdk_config_builder')
const { InitializeBuilder } = require('@zohocrm/nodejs-sdk-2.0/routes/initialize_builder')
const { RecordOperations, SearchRecordsParam } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/record_operations')
const { ParameterMap } = require('@zohocrm/nodejs-sdk-2.0/routes/parameter_map')
const { HeaderMap } = require('@zohocrm/nodejs-sdk-2.0/routes/header_map')
const { BodyWrapper } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/body_wrapper')
const { MasterModel: ZCRMRecord } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/record')
const { ActionWrapper } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/action_wrapper')
const { SuccessResponse } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/success_response')
const { APIException } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/api_exception')
const { Choice } = require('@zohocrm/nodejs-sdk-2.0/utils/util/choice')

async function initialize() {
    let user = new UserSignature($vars.ZOHO_API_USER_EMAIL)
    let environment = USDataCenter.PRODUCTION()
    let token = new OAuthBuilder()
        .clientId($vars.ZOHO_API_CLIENT_ID)
        .clientSecret($vars.ZOHO_API_CLIENT_SECRET)
        .refreshToken($vars.ZOHO_API_CLIENT_REFRESH_TOKEN)
        .build()
    let tokenstore = new FileStore($vars.ZOHO_API_CLIENT_TOKEN_PATH)
    let sdkConfig = new SDKConfigBuilder().pickListValidation(false).autoRefreshFields(true).build()
    try {
        ;(await new InitializeBuilder())
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

function getAPIExceptionText(exception) {
    const result = [exception.getMessage().getValue()]
    let details = exception.getDetails()

    if (details != null) {
        Array.from(details.keys()).forEach((key) => result.push(` - ${key}: ${details.get(key)}`))
    }

    return result.join('\n')
}

async function findContact(email) {
    const moduleAPIName = 'Contacts'
    const recordOperations = new RecordOperations()
    const paramInstance = new ParameterMap()
    const fieldsArray = ['id']
    await paramInstance.add(SearchRecordsParam.FIELDS, fieldsArray.toString())
    await paramInstance.add(SearchRecordsParam.PAGE, 1)
    await paramInstance.add(SearchRecordsParam.PER_PAGE, 1)
    await paramInstance.add(SearchRecordsParam.CRITERIA, `(Email:starts_with:${email})`)

    let headerInstance = new HeaderMap()

    let response = await recordOperations.searchRecords(moduleAPIName, paramInstance, headerInstance)

    if (response?.getObject()?.getData()?.length > 0) {
        return response?.getObject()?.getData()[0]?.getKeyValue('id')
    }

    throw new Error(`Contact with Email ${email} not found`)
}

async function findLead(email) {
    const moduleAPIName = 'Leads'
    const recordOperations = new RecordOperations()
    const paramInstance = new ParameterMap()
    const fieldsArray = ['id']
    await paramInstance.add(SearchRecordsParam.FIELDS, fieldsArray.toString())
    await paramInstance.add(SearchRecordsParam.PAGE, 1)
    await paramInstance.add(SearchRecordsParam.PER_PAGE, 1)
    await paramInstance.add(SearchRecordsParam.CRITERIA, `(Email:starts_with:${email})`)

    let headerInstance = new HeaderMap()

    let response = await recordOperations.searchRecords(moduleAPIName, paramInstance, headerInstance)

    if (response?.getObject()?.getData()?.length > 0) {
        return response?.getObject()?.getData()[0]?.getKeyValue('id')
    }

    throw new Error(`Lead with Email ${email} not found`)
}

async function createLead(data) {
    const moduleAPIName = 'Leads'

    //Get instance of RecordOperations Class
    const recordOperations = new RecordOperations()
    const request = new BodyWrapper()
    const record = new ZCRMRecord()

    for (let key of Object.keys(data)) {
        record.addKeyValue(key, data[key])
    }

    request.setData([record])

    const headerInstance = new HeaderMap()
    const response = await recordOperations.createRecords(moduleAPIName, request, headerInstance)
    const responseObject = response?.getObject()

    if (responseObject instanceof ActionWrapper) {
        const actionResponses = responseObject.getData()
        const firstResponse = actionResponses[0] ?? undefined
        if (firstResponse instanceof SuccessResponse) {
            const details = firstResponse.getDetails()
            return details.get('id')
        } else if (firstResponse instanceof APIException) {
            throw new Error(getAPIExceptionText(firstResponse))
        } else {
            throw new Error('Empty response')
        }
    } else if (responseObject instanceof APIException) {
        throw new Error(getAPIExceptionText(responseObject))
    } else {
        throw new Error('Unknown error')
    }
}

async function checkContactExistence() {
    await initialize()
    const promises = [
        async () => await findContact($user_email),
        async () => await findLead($user_email),
        async () =>
            await createLead({
                Last_Name: $user_name,
                Company: $user_name,
                Email: $user_email,
                Lead_Source: new Choice('Chat')
            })
    ]
    for (let promise of promises) {
        try {
            await promise()
            break
        } catch (err) {
            console.log(err?.message || 'Unknown error')
        }
    }
}

/* Validation */
function isEmailValid(email) {
    const re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
    return re.test(String(email))
}

if (!$user_name) {
    return `Ask the user to provide their name.`
} else if (!$user_email) {
    return `Ask the user to provide their email address`
} else if (!isEmailValid($user_email)) {
    return `Ask the user to provide a valid email address`
}

await checkContactExistence()
return 'Simply say `Redirecting to the Support Center`'
