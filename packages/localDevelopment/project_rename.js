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
const platformClient = require('purecloud-platform-client-v2')
const client = platformClient.ApiClient.instance

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

async function getHistoryMessages(sessionId) {
    const fetch = require('node-fetch')
    const { chatflowId } = $flow
    const date = new Date()
    date.setDate(date.getDate() - 1)
    const startDate = date.toISOString().split('T')[0]

    const uri = `${$vars.FLOWISE_HOST}api/v1/chatmessage/${chatflowId}?startDate=${startDate}&sessionId=${sessionId}&order=DESC`
    try {
        const response = await fetch(uri, {
            headers: {
                Authorization: `Basic ${$vars.FLOWISE_AUTH_BASIC}`
            }
        })
        const messageList = await response.json()
        const latestMessageCount = $vars.LATEST_MESSAGE_COUNT || 40
        return messageList.splice(0, latestMessageCount)
    } catch (err) {
        console.error(err)
    }
}

async function findContact(queryString) {
    const moduleAPIName = 'Contacts'
    const recordOperations = new RecordOperations()
    const paramInstance = new ParameterMap()
    const fieldsArray = ['id']
    await paramInstance.add(SearchRecordsParam.FIELDS, fieldsArray.toString())
    await paramInstance.add(SearchRecordsParam.PAGE, 1)
    await paramInstance.add(SearchRecordsParam.PER_PAGE, 1)
    await paramInstance.add(SearchRecordsParam.CRITERIA, queryString)

    let headerInstance = new HeaderMap()

    let response = await recordOperations.searchRecords(moduleAPIName, paramInstance, headerInstance)

    if (response?.getObject()?.getData()?.length > 0) {
        return {
            type: moduleAPIName,
            id: response?.getObject()?.getData()[0].getKeyValue('id')
        }
    }

    throw new Error(`Contact not found`)
}

async function findLead(queryString) {
    const moduleAPIName = 'Leads'
    const recordOperations = new RecordOperations()
    const paramInstance = new ParameterMap()
    const fieldsArray = ['id']
    await paramInstance.add(SearchRecordsParam.FIELDS, fieldsArray.toString())
    await paramInstance.add(SearchRecordsParam.PAGE, 1)
    await paramInstance.add(SearchRecordsParam.PER_PAGE, 1)
    await paramInstance.add(SearchRecordsParam.CRITERIA, queryString)

    let headerInstance = new HeaderMap()

    let response = await recordOperations.searchRecords(moduleAPIName, paramInstance, headerInstance)

    if (response?.getObject()?.getData()?.length > 0) {
        return {
            type: moduleAPIName,
            id: response?.getObject()?.getData()[0].getKeyValue('id')
        }
    }

    throw new Error(`Lead not found`)
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
            return {
                type: moduleAPIName,
                id: details.get('id')
            }
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

async function createTask(data) {
    const moduleAPIName = 'Tasks'

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

async function createNote(data) {
    const moduleAPIName = 'Notes'

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

async function addMessageHistoryToTaskNotes(taskId) {
    const messages = await getHistoryMessages($flow.sessionId)
    if (!messages?.length) {
        return null
    }
    const messageHistory = messages
        .reverse()
        .map((msg) => {
            if (msg?.role === 'userMessage') {
                return `User: ${msg?.content}`
            } else if (msg?.role === 'apiMessage') {
                return `Bot: ${msg?.content}`
            } else {
                return null
            }
        })
        .filter((value) => {
            return value && value.indexOf('add_zoho_task') < 0
        })
        .join('\n\n')

    return await createNote({
        Parent_Id: toRecord(taskId),
        Note_Title: 'Message History',
        Note_Content: messageHistory,
        $se_module: 'Tasks'
    })
}

function makeQueryString() {
    const queryString = [
        $user_email ? `(Email:starts_with:${$user_email})` : false,
        $user_phone ? `((Phone:equals:${$user_phone})or(Mobile:equals:${$user_phone}))` : false
    ]
        .filter((value) => value)
        .join('or')
    return `(${queryString})`
}

function toRecord(value) {
    const record = new ZCRMRecord()
    record.addKeyValue('id', BigInt(value))
    return record
}

async function collectUserIntent() {
    await initialize()
    const queryString = makeQueryString()
    const promises = [
        () => findContact(queryString),
        () => findLead(queryString),
        () =>
            createLead({
                Last_Name: $user_name,
                Company: $user_name,
                Email: $user_email,
                Phone: $user_phone,
                Lead_Source: new Choice('Chat')
            })
    ]

    let contact
    let latestError
    for (let promise of promises) {
        try {
            contact = await promise()
            break
        } catch (err) {
            console.log(err?.message || 'Unknown error')
            latestError = err
        }
    }

    if (!contact) {
        throw new Error('Unable to find/create contact', { cause: latestError })
    }

    // log visit
    await createNote({
        Parent_Id: toRecord(contact.id),
        Note_Title: 'New interaction',
        Note_Content: 'Customer contacted via messenger',
        $se_module: contact.type
    })

    // set customer info to Genesys External Contact
    await updateExternalContact()

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 2)

    const taskId = await createTask({
        Status: new Choice('Not Started'),
        Priority: new Choice('High'),
        Description: $user_intent,
        Due_Date: dueDate,
        Subject: `RFP: ${$category}`,
        What_Id: contact.type === 'Leads' ? toRecord(contact.id) : null,
        Who_Id: contact.type === 'Contacts' ? toRecord(contact.id) : null,
        $se_module: contact.type
    })

    try {
        await addMessageHistoryToTaskNotes(taskId)
    } catch (err) {
        console.error(err)
    }
}

async function updateExternalContact() {
    try {
        await client.loginClientCredentialsGrant($vars.GENESYS_CLIENT_ID, $vars.GENESYS_CLIENT_SECRET)
        const analyticsApi = new platformClient.AnalyticsApi()
        const conversation = await analyticsApi.getAnalyticsConversationDetails($flow.chatId)
        const customer = conversation.participants.find((part) => part.purpose === 'customer')

        if (customer.externalContactId) {
            const externalContactsApi = new platformClient.ExternalContactsApi()
            const externalContact = await externalContactsApi.getExternalcontactsContact(customer.externalContactId)
            const properties = {
                workEmail: $user_email,
                workPhone: $user_phone
                    ? {
                          display: $user_phone
                      }
                    : null,
                firstName: $user_name
            }

            let shouldUpdate = false
            for (const prop in properties) {
                if (properties[prop] && externalContact[prop] !== properties[prop]) {
                    shouldUpdate = true
                    externalContact[prop] = properties[prop]
                }
            }

            if (shouldUpdate) {
                await externalContactsApi.putExternalcontactsContact(customer.externalContactId, externalContact)
            }
        }
    } catch (e) {
        console.error(e)
        return 'Unable to update external contact'
    }
}

/* Validation */
function isEmailValid(email) {
    const re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
    return re.test(String(email))
}

function isPhoneValid(phone) {
    const re = /^\+?[1-9]\d{1,14}$/
    return re.test(String(phone).replace(/\D/g, ''))
}

if (!$user_name) {
    return `Ask the user to provide their name.`
} else if (!($user_email || $user_phone)) {
    return `Ask the user to provide their email address or phone number`
} else if ($user_email && !isEmailValid($user_email)) {
    return `Ask the user to provide a valid email address`
} else if ($user_phone && !isPhoneValid($user_phone)) {
    return `Ask the user to provide a valid phone number`
}

/* Creating Zoho Entities */
try {
    await collectUserIntent()
    return 'Simply say `I have sent the collected information to our manager. We will contact you soon. We invite you to [schedule a call](https://crm.zoho.com/bookings/SchedulecallwithSM?rid=abdf22479998ffd6fd5ee3bc845838e341a5b50e06be8c5f8ca36cb077a96adb1387ee858395f9d8f0f6cddc49bfa3dfgid83e4ae4782bb7ab7b4b77aa42cc755cf48b295ea892a604b626f014f5e30fba7&option=embed) to demonstrate our services.``'
} catch (err) {
    console.log(err)
    return 'Error: Unable to save user intent. Please, contact Support'
}
