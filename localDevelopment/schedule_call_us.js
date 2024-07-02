const { UserSignature } = require('@zohocrm/nodejs-sdk-2.0/routes/user_signature')
const { USDataCenter } = require('@zohocrm/nodejs-sdk-2.0/routes/dc/us_data_center')
const { FileStore } = require('@zohocrm/nodejs-sdk-2.0/models/authenticator/store/file_store')
const { SDKConfigBuilder } = require('@zohocrm/nodejs-sdk-2.0/routes/sdk_config_builder')
const { InitializeBuilder } = require('@zohocrm/nodejs-sdk-2.0/routes/initialize_builder')
const { OAuthBuilder } = require('@zohocrm/nodejs-sdk-2.0/models/authenticator/oauth_builder')
const { RecordOperations, GetRecordsParam } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/record_operations')
const { ParameterMap } = require('@zohocrm/nodejs-sdk-2.0/routes/parameter_map')
const { HeaderMap } = require('@zohocrm/nodejs-sdk-2.0/routes/header_map')
const { MasterModel: ZCRMRecord } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/record')
const { BodyWrapper } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/body_wrapper')
const { ActionWrapper } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/action_wrapper')
const { SuccessResponse } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/success_response')
const { APIException } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/api_exception')
const Participant = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/participants').Participants
const { UsersOperations, GetUsersParam } = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/users/users_operations')
const ResponseWrapper = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/users/response_wrapper').ResponseWrapper
const RecordField = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/field').Field
const fetch = require('node-fetch')
let tokens = null

const businessHours = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeOffset: '-07:00',
    simpleTimeOffset: -7,
    shiftHours: {
        startTime: {
            time: 7,
            period: 'AM'
        },
        endTime: {
            time: 10,
            period: 'AM'
        }
    },
    intervalMinutes: 30
}

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

        tokens = tokenstore.getTokens()
    } catch (error) {
        console.error(error)
    }
}

/**
 * Validates if the provided email address is in a valid format.
 * @param {string} email - The email address to be validated.
 * @returns {boolean} - Returns true if the email is valid, false otherwise.
 */
function isEmailValid(email) {
    const re =
        /^(([^<>()[\]\\.,;:\s@\\"]+(\.[^<>()[\]\\.,;:\s@\\"]+)*)|(\\".+\\"))@(([^<>()[\]\\.,;:\s@\\"]+\.)+[^<>()[\]\\.,;:\s@\\"]{2,})$/i
    return re.test(String(email))
}

/**
 * Formats the API exception details into a readable string.
 * @param {object} exception - The exception object from the API.
 * @returns {string} - Returns the formatted exception details.
 */
function getAPIExceptionText(exception) {
    // Get the main exception message
    const result = [exception.getMessage().getValue()]
    let details = exception.getDetails()

    // If there are additional details, format them into the result
    if (details != null) {
        Array.from(details.keys()).forEach((key) => result.push(` - ${key}: ${details.get(key)}`))
    }

    return result.join('\n') // Join all details into a single string with newlines
}

/**
 * Creates an event record in the API.
 * @param {object} data - The data object containing event details.
 * @returns {string} - Returns the ID of the created event.
 * @throws Will throw an error if the API response contains an exception.
 */
async function createEvent(data) {
    const moduleAPIName = 'Events'

    // Get instance of RecordOperations Class
    const recordOperations = new RecordOperations()
    const request = new BodyWrapper()
    const record = new ZCRMRecord()

    // Add all key-value pairs from the data object to the record
    for (let key of Object.keys(data)) {
        record.addKeyValue(key, data[key])
    }

    record.addKeyValue('$send_notification', true)

    let startDateTime = new Date(data.Start_DateTime)
    let endDateTime = new Date(data.End_DateTime)

    record.addFieldValue(RecordField.Events.START_DATETIME, startDateTime)
    record.addFieldValue(RecordField.Events.END_DATETIME, endDateTime)

    request.setData([record]) // Set the record data to the request

    const headerInstance = new HeaderMap()
    const response = await recordOperations.createRecords(moduleAPIName, request, headerInstance)
    const responseObject = response?.getObject()
    if (responseObject instanceof ActionWrapper) {
        const actionResponses = responseObject.getData()
        const firstResponse = actionResponses[0] ?? undefined
        if (firstResponse instanceof SuccessResponse) {
            const details = firstResponse.getDetails()
            return details.get('id') // Return the ID of the created event
        } else if (firstResponse instanceof APIException) {
            throw new Error(getAPIExceptionText(firstResponse)) // Throw an error with exception details
        } else {
            throw new Error('Empty response') // Throw an error if the response is empty
        }
    } else if (responseObject instanceof APIException) {
        throw new Error(getAPIExceptionText(responseObject)) // Throw an error with exception details
    } else {
        throw new Error('Unknown error') // Throw an error for any other unknown issues
    }
}

/**
 *  Get Users
 * This method is used to retrieve the users data specified in the API request.
 */
getUsers = async () => {
    let usersOperations = new UsersOperations()
    let paramInstance = new ParameterMap()

    /* Possible parameters for Get Users operation */
    await paramInstance.add(GetUsersParam.TYPE, 'ActiveUsers')
    await paramInstance.add(GetUsersParam.PAGE, 1)
    await paramInstance.add(GetUsersParam.PER_PAGE, 200)

    let headerInstance = new HeaderMap()
    let response = await usersOperations.getUsers(paramInstance, headerInstance)

    if (response != null) {
        //Get the status code from response
        console.log('Status Code: ' + response.getStatusCode())

        if ([204, 304].includes(response.getStatusCode())) {
            console.log(response.getStatusCode() == 204 ? 'No Content' : 'Not Modified')

            return
        }

        //Get object from response
        let responseObject = response.getObject()

        if (responseObject != null && responseObject instanceof ResponseWrapper) {
            const users = responseObject.getUsers()
            const result = []

            // Extract required fields from each event record and add to the result array
            users.forEach((user) => {
                result.push({
                    id: user.getId(),
                    email: user.getEmail()
                })
            })

            return result // Return the array of event objects
        } else if (response?.object === null) {
            return []
        }
    }
}

/**
 * Fetches events from the API.
 * @returns {Array} - Returns an array of event objects.
 * @throws Will throw an error if no events are found.
 */
async function getEvents() {
    const moduleAPIName = 'Events'
    const recordOperations = new RecordOperations()
    const paramInstance = new ParameterMap()
    const fieldsArray = ['Start_DateTime', 'End_DateTime', 'Participants']
    await paramInstance.add(GetRecordsParam.FIELDS, fieldsArray.toString())

    let headerInstance = new HeaderMap()

    let response = await recordOperations.getRecords(moduleAPIName, paramInstance, headerInstance)

    // Check if the response contains data
    if (response?.object?.getData()?.length > 0) {
        const data = response?.object?.getData()
        const result = []

        // Extract required fields from each event record and add to the result array
        data.forEach((lead) => {
            result.push({
                type: moduleAPIName,
                Start_DateTime: lead.getKeyValue('Start_DateTime'),
                End_DateTime: lead.getKeyValue('End_DateTime'),
                Participant: lead.getKeyValue('Participants')[0]?.keyValues.get('participant')
            })
        })

        return result // Return the array of event objects
    } else if (response?.object === null) {
        return []
    }

    throw new Error(`Events not found`) // Throw an error if no events are found
}

/**
 * Converts time from 12-hour format (AM/PM) to 24-hour format.
 * @param {number} time - The hour in 12-hour format.
 * @param {string} period - The period, either 'AM' or 'PM'.
 * @returns {number} - The hour in 24-hour format.
 */
const convertTo24HourFormat = (time, period) => {
    if (period === 'PM' && time !== 12) {
        return time + 12
    } else if (period === 'AM' && time === 12) {
        return 0
    }
    return time
}

/**
 * Converts UTC date to the specified timezone date and returns it as a Date object.
 * @param {string} utcDateStr - The date string in UTC (e.g., '2024-06-19T14:00:00.000Z').
 * @param {number} offset - The timezone offset in hours.
 * @returns {Date} - The date object in the specified timezone.
 */
const convertUTCToTimeZone = (utcDateStr, offset) => {
    const utcDate = new Date(utcDateStr)
    return new Date(utcDate.getTime() + offset * 60 * 60 * 1000)
}

/**
 * Checks if the provided variable is a string.
 * @param {*} variable - The variable to be checked.
 * @returns {boolean} - Returns true if the variable is a string, false otherwise.
 */
function isString(variable) {
    return typeof variable === 'string'
}

const filterEvents = (events, startDate, endDate) => {
    return events.filter((event) => {
        const eventStart = new Date(
            isString(event.Start_DateTime)
                ? event.Start_DateTime.replace('Z', businessHours.timeOffset)
                : event.Start_DateTime.toISOString().replace('Z', businessHours.timeOffset)
        )

        return eventStart >= startDate && eventStart <= endDate
    })
}

/**
 * Filters and converts events to employed slots for a specific date.
 * @param {Array} events - The array of event objects.
 * @param {string} date - The date string in YYYY-MM-DD format.
 * @returns {Array} - The array of employed slots for the specified date.
 */
const employedSlotsForDate = (events, date) => {
    const requestedDate = new Date(date)
    requestedDate.setHours(0, 0, 0, 0)

    const endDate = new Date(requestedDate)
    endDate.setDate(endDate.getDate() + 1)
    endDate.setHours(0, 0, 0, 0)

    let eventsForDate = filterEvents(events, requestedDate, endDate)

    // Convert event times to time zone
    eventsForDate = eventsForDate.map((event) => {
        event.Start_DateTime = convertUTCToTimeZone(event.Start_DateTime, businessHours.simpleTimeOffset)
            .toISOString()
            .replace('Z', businessHours.timeOffset) // Convert to time zone
        event.End_DateTime = convertUTCToTimeZone(event.End_DateTime, businessHours.simpleTimeOffset)
            .toISOString()
            .replace('Z', businessHours.timeOffset) // Convert to time zone
        return event
    })

    return eventsForDate
}

/**
 * Filters events within the next three business days (excluding weekends) and converts times to time offset.
 * @param {Array} events - The array of event objects.
 * @returns {Array} - The filtered array of events happening within the next three business days in time offset.
 */
const employedSlots = (events) => {
    const today = new Date()
    const threeBusinessDays = []
    let dayCount = 1 // Start from tomorrow

    while (threeBusinessDays.length < 3) {
        const nextDay = new Date(today)
        nextDay.setDate(today.getDate() + dayCount)
        const dayOfWeek = nextDay.getDay()

        // Exclude Saturday (6) and Sunday (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            threeBusinessDays.push(nextDay)
        }

        dayCount++
    }

    const startDate = threeBusinessDays[0]
    const endDate = new Date(threeBusinessDays[2])
    endDate.setHours(23, 59, 59, 999)

    let upcomingEvents = filterEvents(events, startDate, endDate)

    // Convert event times to time zone
    upcomingEvents = upcomingEvents.map((event) => {
        event.Start_DateTime = convertUTCToTimeZone(event.Start_DateTime, businessHours.simpleTimeOffset)
            .toISOString()
            .replace('Z', businessHours.timeOffset) // Convert to time zone
        event.End_DateTime = convertUTCToTimeZone(event.End_DateTime, businessHours.simpleTimeOffset)
            .toISOString()
            .replace('Z', businessHours.timeOffset) // Convert to time zone
        return event
    })

    return upcomingEvents
}

/**
 * Creates an array of time slots between the start and end times with a specified interval in time offset.
 * @param {Date} start - The start time as a Date object.
 * @param {Date} end - The end time as a Date object.
 * @param {number} interval - The interval in minutes.
 * @returns {string[]} - An array of formatted time slots.
 */
const createTimeSlots = (start, end, interval) => {
    const timeSlots = []
    let currentTime = new Date(start)

    while (currentTime < end) {
        const hours = currentTime.getHours()
        const minutes = currentTime.getMinutes()
        const period = hours < 12 ? 'AM' : 'PM'
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12
        const formattedMinutes = minutes === 0 ? '00' : minutes
        const formattedTime = `${formattedHours}:${formattedMinutes} ${period}`
        timeSlots.push(formattedTime)
        currentTime.setMinutes(currentTime.getMinutes() + interval)
    }

    return timeSlots
}

/**
 * Checks if there are free slots for the given date.
 * @param {Array} events - The array of event objects.
 * @param {Date} date - The date to check for free slots.
 * @returns {boolean} - Returns true if there are free slots, false otherwise.
 */
const hasFreeSlotsForDate = (events, date) => {
    const startHour = convertTo24HourFormat(businessHours.shiftHours.startTime.time, businessHours.shiftHours.startTime.period)
    const endHour = convertTo24HourFormat(businessHours.shiftHours.endTime.time, businessHours.shiftHours.endTime.period)

    const startTime = new Date(date)
    startTime.setHours(startHour, 0, 0, 0)

    const endTime = new Date(date)
    endTime.setHours(endHour, 0, 0, 0)

    let eventsForDate = filterEvents(events, startTime, endTime)

    const allTimeSlots = createTimeSlots(startTime, endTime, businessHours.intervalMinutes)
    const bookedTimeSlots = new Set(eventsForDate.map((event) => new Date(event.Start_DateTime).toISOString()))

    const freeSlots = allTimeSlots.filter((slot) => {
        const slotTime = combineDateAndTime(date.toISOString().split('T')[0], slot).toISOString()
        return !bookedTimeSlots.has(slotTime)
    })

    return freeSlots.length > 0
}

/**
 * Creates a schedule with available time slots for the next three business days in time offset or for a specific given day.
 * @param {Array} events - The array of event objects.
 * @param {string} [startDate] - The start date in YYYY-MM-DD format. If not provided, uses today's date.
 * @param {boolean} [forDate] - If its for checkSlotsForDate method
 * @returns {Array} - An array of objects representing each day with available time slots.
 */
const breakingTimeIntoSlots = (events, startDate, forDate) => {
    const startHour = convertTo24HourFormat(businessHours.shiftHours.startTime.time, businessHours.shiftHours.startTime.period)
    const endHour = convertTo24HourFormat(businessHours.shiftHours.endTime.time, businessHours.shiftHours.endTime.period)

    const today = startDate ? new Date(startDate) : new Date()
    const schedule = []
    let dayCount = startDate ? 0 : 1 // Start from tomorrow if no start date is provided

    while (schedule.length < (startDate ? 1 : 3)) {
        // If start date is provided, only get slots for one day
        const dayDate = new Date(today)
        dayDate.setDate(today.getDate() + dayCount)
        const dayOfWeek = dayDate.getDay()

        if (isBusinessDay(dayDate)) {
            const startTime = new Date(dayDate)
            startTime.setHours(startHour, 0, 0, 0)

            const endTime = new Date(dayDate)
            endTime.setHours(endHour, 0, 0, 0)

            const dailyTimeSlots = createTimeSlots(startTime, endTime, businessHours.intervalMinutes)

            // Check if there are free slots for this day
            const freeSlots = dailyTimeSlots.filter((slot) => {
                const slotTime = combineDateAndTime(dayDate.toISOString().split('T')[0], slot).toISOString()
                return !events.some((event) => new Date(event.Start_DateTime).toISOString() === slotTime)
            })

            if (freeSlots.length > 0 && !forDate) {
                schedule.push({
                    day: businessHours.days[dayOfWeek - 1],
                    date: dayDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
                    timeSlots: freeSlots
                })
            } else if (forDate) {
                schedule.push({
                    day: businessHours.days[dayOfWeek - 1],
                    date: dayDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
                    timeSlots: freeSlots
                })
            }
        }

        dayCount++
    }

    return schedule
}

/**
 * Helper function to combine date and time in time offset.
 * @param {string} date - The date string in YYYY-MM-DD format.
 * @param {string} time - The time string in hh:mm AM/PM format.
 * @returns {Date} - The combined date and time in ISO format in time offset.
 */
const combineDateAndTime = (date, time) => {
    const [hours, minutes] = time.split(/[: ]/)
    const period = time.slice(-2)
    let hour = parseInt(hours)
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return new Date(`${date}T${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00${businessHours.timeOffset}`)
}

/**
 * Generates free slots by excluding employed slots from the schedule.
 * @param {Object} slots - The slots object containing employed and free slots.
 * @returns {Array} - An array of free slots.
 */
const generateFreeSlots = (slots) => {
    const employedTimes = new Set()
    slots.employed.forEach((event) => {
        let currentTime = new Date(event.Start_DateTime)
        while (currentTime < new Date(event.End_DateTime)) {
            employedTimes.add(currentTime.toISOString())
            currentTime.setMinutes(currentTime.getMinutes() + businessHours.intervalMinutes)
        }
    })

    const freeSlots = []

    slots.free.forEach((daySchedule) => {
        const { day, date, timeSlots } = daySchedule
        const dayFreeSlots = timeSlots
            .filter((slot) => {
                const slotTime = combineDateAndTime(date, slot)
                return !employedTimes.has(slotTime.toISOString())
            })
            .map((slot) => ({
                day,
                date,
                time: slot
            }))

        if (dayFreeSlots.length > 0) {
            freeSlots.push(...dayFreeSlots)
        }
    })

    return freeSlots
}

/**
 * Generates a random time slot from the list of free slots for each of the next three business days.
 * @param {Array} freeSlots - The array of free slots generated by the generateFreeSlots function.
 * @returns {Array} - An array of randomly selected time slots for each of the next three business days.
 */
const selectRandomSlots = (freeSlots) => {
    const selectedSlots = []
    const slotsByDay = {}

    // Group free slots by day
    freeSlots.forEach((slot) => {
        if (!slotsByDay[slot.date]) {
            slotsByDay[slot.date] = []
        }
        slotsByDay[slot.date].push(slot)
    })

    // Randomly select a slot for each of the next three business days
    Object.keys(slotsByDay)
        .slice(0, 3)
        .forEach((date) => {
            const daySlots = slotsByDay[date]
            const randomIndex = Math.floor(Math.random() * daySlots.length)
            selectedSlots.push(daySlots[randomIndex])
        })

    return selectedSlots
}

/**
 * Validates the time format to ensure it matches the ISO 8601 format with timezone offset.
 * @param {string} time - The time string to validate (e.g., '2024-06-20T07:00:00.000Z').
 * @returns {boolean} - Returns true if the time format is valid, false otherwise.
 */
const validateISO8601TimeWithTimezone = (time) => {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/
    return iso8601Regex.test(time)
}

/**
 * Adds 30 minutes to the given time slot and validates the resulting time.
 * @param {string} startTime - The start time in ISO format with timezone offset (e.g., '2024-06-19T08:30:00-07:00').
 * @returns {string|null} - The end time in ISO format after adding 30 minutes if valid, otherwise null.
 */
const addThirtyMinutesAndValidate = (startTime) => {
    if (!validateISO8601TimeWithTimezone(startTime)) {
        console.error('Invalid start time format')
        return null
    }

    const date = new Date(startTime.replace(businessHours.timeOffset, '-00:00'))
    date.setMinutes(date.getMinutes() + 30)

    // Extract the timezone offset from the original startTime
    const timezoneOffset = startTime.slice(-6)
    const [datePart, timePart] = date.toISOString().split('T')
    const endTime = `${datePart}T${timePart.slice(0, -1)}${timezoneOffset}`.replace('.000', '')

    if (!validateISO8601TimeWithTimezone(endTime)) {
        console.error('Invalid end time format')
        return null
    }
    return endTime
}

/**
 * Checks for free and employed slots on a specific date and provides a list of available slots.
 * @param {Array} employedSlots - The array of employed slots.
 * @param {string} date - The date string in YYYY-MM-DD format.
 * @param {Array} events - The array of event objects.
 * @returns {Array|string} - Returns an array of available time slots or a message if all slots are booked.
 */
const checkSlotsForDate = (employedSlots, date, events) => {
    const requestedDate = new Date(date)
    requestedDate.setHours(0, 0, 0, 0)

    const bookedSlots = employedSlots.filter((slot) => {
        const slotDate = new Date(slot.Start_DateTime.replace(businessHours.timeOffset, '-00:00'))
        slotDate.setHours(0, 0, 0, 0)
        return slotDate.getTime() === requestedDate.getTime()
    })

    const breakingTimeSlots = breakingTimeIntoSlots(events, date, true)

    if (breakingTimeSlots.length) {
        const allSlots = breakingTimeSlots.filter((slot) => {
            const slotDate = new Date(slot.date)
            slotDate.setHours(0, 0, 0, 0)
            return slotDate.getTime() === requestedDate.getTime()
        })[0].timeSlots

        const freeSlots = allSlots.filter((timeSlot) => {
            const slotTime = combineDateAndTime(date, timeSlot).toISOString()
            return !bookedSlots.some((bookedSlot) => {
                const bookedStartTime = new Date(bookedSlot.Start_DateTime).toISOString()
                const bookedEndTime = new Date(bookedSlot.End_DateTime).toISOString()
                return slotTime >= bookedStartTime && slotTime < bookedEndTime
            })
        })

        if (freeSlots.length > 0) {
            return freeSlots
        } else {
            return 'All slots are booked for this date. Please choose another date.'
        }
    } else {
        return 'All slots are booked for this date. Please choose another date.'
    }
}

/**
 * Converts user-specified date and time to ISO 8601 format with timezone offset.
 * @param {string} date - The date string in YYYY-MM-DD format.
 * @param {string} time - The time string in hh:mm AM/PM format.
 * @param {string} offset - The timezone offset in hours.
 * @returns {string} - The date and time in ISO 8601 format with timezone offset.
 */
const convertToISO8601WithTimezone = (date, time) => {
    const [hours, minutes] = time.split(/[: ]/)
    const period = time.slice(-2)
    let hour = parseInt(hours)
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    const isoDate = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00-00:00`)
    return isoDate.toISOString().replace('.000Z', businessHours.timeOffset)
}

/**
 * Checks if the given date is a business day.
 * @param {string} dateStr - The date string in YYYY-MM-DD format.
 * @returns {boolean} - Returns true if the date is a business day, false otherwise.
 */
const isBusinessDay = (dateStr) => {
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay()
    // Exclude Saturday (6) and Sunday (0)
    return dayOfWeek !== 0 && dayOfWeek !== 6
}

/**
 * Checks if the given time is within business hours.
 * @param {string} timeStr - The time string in hh:mm AM/PM format.
 * @returns {boolean} - Returns true if the time is within business hours, false otherwise.
 */
const isWithinBusinessHours = (timeStr) => {
    const [time, period] = timeStr.split(' ')
    const [hours, minutes] = time.split(':')

    const startHour = convertTo24HourFormat(businessHours.shiftHours.startTime.time, businessHours.shiftHours.startTime.period)
    const endHour = convertTo24HourFormat(businessHours.shiftHours.endTime.time, businessHours.shiftHours.endTime.period)

    const inputHour = convertTo24HourFormat(parseInt(hours), period)
    return inputHour >= startHour && inputHour <= endHour
}

const updateEvent = async (accessToken, eventId, remindAt) => {
    const data = JSON.stringify({
        data: [
            {
                id: eventId,
                Remind_At: remindAt
            }
        ]
    })

    const response = await fetch('https://www.zohoapis.com/crm/v2/Events', {
        method: 'PUT',
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: data
    })

    if (!response.ok) {
        const errorData = await response.text()
        console.log(errorData)
        throw new Error(`Failed to update event: ${response.status} ${errorData}`)
    }

    return response.json()
}

try {
    await initialize()
    const events = await getEvents()

    let slots = {
        employed: employedSlots(events),
        free: breakingTimeIntoSlots(events)
    }
    let freeSlots = generateFreeSlots(slots)

    while (freeSlots.length < 3) {
        const lastDate = new Date(slots.free[slots.free.length - 1].date)
        lastDate.setDate(lastDate.getDate() + 1)
        const additionalFreeSlots = breakingTimeIntoSlots(events, lastDate.toISOString().split('T')[0])
        slots.free.push(...additionalFreeSlots)
        const newFreeSlots = generateFreeSlots({ employed: slots.employed, free: additionalFreeSlots })
        freeSlots.push(...newFreeSlots)
    }

    const selectedRandomSlots = selectRandomSlots(freeSlots)

    if (!$userName) {
        return `Ask the user to provide their name.`
    } else if (!$userEmail) {
        return `Ask the user to provide their email address`
    } else if ($userEmail && !isEmailValid($userEmail)) {
        return `Ask the user to provide a valid email address`
    }

    if ($date === '' && $time === '') {
        if (selectedRandomSlots.length) {
            const firstOption = selectedRandomSlots[0] ? `date: ${selectedRandomSlots[0].date}, time: ${selectedRandomSlots[0].time}` : ''
            const secondOption = selectedRandomSlots[1] ? `date: ${selectedRandomSlots[1].date}, time: ${selectedRandomSlots[1].time}` : ''
            const thirdOption = selectedRandomSlots[2] ? `date: ${selectedRandomSlots[2].date}, time: ${selectedRandomSlots[2].time}` : ''
            return `Simply say 'All provided slots (Options: 1 - ${firstOption}, 2 - ${secondOption}, 3- ${thirdOption})
            That time slots is indicated in the Pacific Standard Time'`
        } else if (!selectedRandomSlots || !selectedRandomSlots.length) {
            return 'Error: Unable to schedule call. Please, contact Support'
        }
    }

    const { startTime, endTime } = businessHours.shiftHours
    const { days } = businessHours

    if ($date !== '' && !isBusinessDay($date)) {
        return `Ask about another day, since this day is not a working day, write that working days are from ${days[0]} to ${
            days[days.length - 1]
        }`
    } else if ($time !== '' && !isWithinBusinessHours($time)) {
        return `Ask about another time, since this time is not working time, write that working time is ${
            startTime.time + ' ' + startTime.period
        } - ${endTime.time + ' ' + endTime.period}`
    }

    if ($date !== '' && $time !== '') {
        const isoFormattedDate = convertToISO8601WithTimezone($date, $time)
        const endTime = addThirtyMinutesAndValidate(isoFormattedDate)

        if (validateISO8601TimeWithTimezone(isoFormattedDate)) {
            const users = await getUsers()
            let participantsArray = []
            let participant = new Participant()

            participant.setParticipant($userEmail)
            participant.setType('email')
            participant.setInvited(true)
            participantsArray.push(participant)

            if (users && users.length) {
                users.forEach((user) => {
                    participant = new Participant()
                    participant.addKeyValue('participant', `${user.id}`)
                    participant.setType('user')
                    participant.setInvited(true)
                    participantsArray.push(participant)
                })
            }

            try {
                const recordId = await createEvent({
                    Event_Title: `Meeting with ${$userName}`,
                    All_day: false,
                    Start_DateTime: new Date(isoFormattedDate),
                    End_DateTime: new Date(endTime),
                    Participants: participantsArray
                })

                if (recordId && tokens.length) {
                    const response = await updateEvent(tokens[tokens.length - 1].accessToken, recordId, '15 mins')
                    console.log('Event updated successfully:', response)
                }

                return `We have scheduled a call for this time and date, a reminder will be sent to you 15 minutes before the call`
            } catch (error) {
                return (
                    `It was not possible to create a scheduled call for this time and date, try another date or time` +
                    tokens[tokens.length - 1].accessToken
                )
            }
        }
    } else if ($date !== '' && $time === '') {
        const employedSlotsByDate = employedSlotsForDate(events, $date)
        console.table(employedSlotsByDate)
        const availableSlotsOrMessage = checkSlotsForDate(employedSlotsByDate, $date, events)

        if (Array.isArray(availableSlotsOrMessage)) {
            let message = `Simply say 'Available slots for ${$date}:\n'`
            availableSlotsOrMessage.forEach((slot) => {
                message += `- ${slot}\n`
            })

            console.log(message)
            return message
        } else {
            return availableSlotsOrMessage // Print the message if all slots are booked
        }
    }
} catch (err) {
    return 'Error: Unable to schedule call. Please, contact Support '
}
