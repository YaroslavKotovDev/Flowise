const fs = require('fs')
const path = require('path')
const {
    RecordOperations,
    DeleteRecordParam,
    DeleteRecordsParam,
    GetDeletedRecordsHeader,
    GetDeletedRecordsParam,
    GetMassUpdateStatusParam,
    GetRecordHeader,
    GetRecordParam,
    GetRecordsHeader,
    GetRecordsParam,
    SearchRecordsParam
} = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/record_operations')
const Participants = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/participants').Participants
const Territory = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/territory').Territory
const StreamWrapper = require('@zohocrm/nodejs-sdk-2.0/utils/util/stream_wrapper').StreamWrapper
const FileBodyWrapper = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/file_body_wrapper').FileBodyWrapper
const ZCRMUser = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/users/user').User
const FileDetails = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/file_details').FileDetails
const RemindAt = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/remind_at').RemindAt
const Participant = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/participants').Participants
const RecurringActivity = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/recurring_activity').RecurringActivity
const ZCRMRecord = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/record').MasterModel
const ZCRMLayout = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/layouts/layout').Layout
const PricingDetails = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/pricing_details').PricingDetails
const LineItemProduct = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/line_item_product').LineItemProduct
const Tag = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/tags/tag').Tag
const LineTax = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/line_tax').LineTax
const InventoryLineItems = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/inventory_line_items').InventoryLineItems
const ResponseWrapper = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/response_wrapper').ResponseWrapper
const DeletedRecordsWrapper = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/deleted_records_wrapper').DeletedRecordsWrapper
const BodyWrapper = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/body_wrapper').BodyWrapper
const MassUpdateBodyWrapper = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/mass_update_body_wrapper').MassUpdateBodyWrapper
const MassUpdateActionWrapper =
    require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/mass_update_action_wrapper').MassUpdateActionWrapper
const MassUpdateResponseWrapper =
    require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/mass_update_response_wrapper').MassUpdateResponseWrapper
const MassUpdateSuccessResponse =
    require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/mass_update_success_response').MassUpdateSuccessResponse
const MassUpdate = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/mass_update').MassUpdate
const ConvertBodyWrapper = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/convert_body_wrapper').ConvertBodyWrapper
const LeadConverter = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/lead_converter').LeadConverter
const ActionWrapper = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/action_wrapper').ActionWrapper
const ConvertActionWrapper = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/convert_action_wrapper').ConvertActionWrapper
const RecordField = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/field').Field
const Consent = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/consent').Consent
const APIException = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/api_exception').APIException
const SuccessResponse = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/success_response').SuccessResponse
const SuccessfulConvert = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/successful_convert').SuccessfulConvert
const Comment = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/comment').Comment
const ParameterMap = require('@zohocrm/nodejs-sdk-2.0/routes/parameter_map').ParameterMap
const HeaderMap = require('@zohocrm/nodejs-sdk-2.0/routes/header_map').HeaderMap
const Choice = require('@zohocrm/nodejs-sdk-2.0/utils/util/choice').Choice
const Reminder = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/record/reminder').Reminder
const Attachment = require('@zohocrm/nodejs-sdk-2.0/core/com/zoho/crm/api/attachments/attachment').Attachment

class Record {
    /**
     * Get Records
     * This method is used to get all the records of a module and print the response.
     * @param {String} moduleAPIName The API Name of the module to fetch records
     */
    static async getRecords(moduleAPIName) {
        //example
        //let moduleAPIName = "Leads";

        //Get instance of RecordOperations Class
        let recordOperations = new RecordOperations()

        //Get instance of ParameterMap Class
        let paramInstance = new ParameterMap()

        /* Possible parameters for Get Records operation*/
        await paramInstance.add(GetRecordsParam.APPROVED, 'both')

        await paramInstance.add(GetRecordsParam.CONVERTED, 'both')

        await paramInstance.add(GetRecordsParam.CVID, '3477061000000087501')

        let ids = [3477061000005623115n, 3477061000004352001n]

        for (let id of ids) {
            await paramInstance.add(GetRecordsParam.IDS, id)
        }

        await paramInstance.add(GetRecordsParam.UID, '3477061000005181008')

        let fieldNames = ['Company', 'Email']

        await paramInstance.add(GetRecordsParam.FIELDS, fieldNames.toString())

        await paramInstance.add(GetRecordsParam.SORT_BY, 'Email')

        await paramInstance.add(GetRecordsParam.SORT_ORDER, 'desc')

        await paramInstance.add(GetRecordsParam.PAGE, 1)

        await paramInstance.add(GetRecordsParam.PER_PAGE, 200)

        let startDateTime = new Date(2020, 1, 10, 10, 10, 10)

        await paramInstance.add(GetRecordsParam.STARTDATETIME, startDateTime)

        let endDateTime = new Date(2020, 7, 10, 12, 12, 12)

        await paramInstance.add(GetRecordsParam.ENDDATETIME, endDateTime)

        await paramInstance.add(GetRecordsParam.TERRITORY_ID, '3409643000000505351')

        await paramInstance.add(GetRecordsParam.INCLUDE_CHILD, 'true')

        //Get instance of HeaderMap Class
        let headerInstance = new HeaderMap()

        /* Possible headers for Get Record operation*/
        await headerInstance.add(GetRecordsHeader.IF_MODIFIED_SINCE, new Date('2020-01-01T00:00:00+05:30'))

        //Call getRecords method that takes paramInstance, headerInstance and moduleAPIName as parameters
        let response = await recordOperations.getRecords(moduleAPIName, paramInstance, headerInstance)

        if (response != null) {
            //Get the status code from response
            console.log('Status Code: ' + response.statusCode)

            if ([204, 304].includes(response.statusCode)) {
                console.log(response.statusCode == 204 ? 'No Content' : 'Not Modified')

                return
            }

            //Get the object from response
            let responseObject = response.object

            if (responseObject != null) {
                //Check if expected ResponseWrapper instance is received
                if (responseObject instanceof ResponseWrapper) {
                    //Get the array of obtained Record instances
                    let records = responseObject.getData()

                    for (let index = 0; index < records.length; index++) {
                        let record = records[index]

                        //Get the ID of each Record
                        console.log('Record ID: ' + record.getId())

                        //Get the createdBy User instance of each Record
                        let createdBy = record.getCreatedBy()

                        //Check if createdBy is not null
                        if (createdBy != null) {
                            //Get the ID of the createdBy User
                            console.log('Record Created By User-ID: ' + createdBy.getId())

                            //Get the name of the createdBy User
                            console.log('Record Created By User-Name: ' + createdBy.getName())

                            //Get the Email of the createdBy User
                            console.log('Record Created By User-Email: ' + createdBy.getEmail())
                        }

                        //Get the CreatedTime of each Record
                        console.log('Record CreatedTime: ' + record.getCreatedTime())

                        //Get the modifiedBy User instance of each Record
                        let modifiedBy = record.getModifiedBy()

                        //Check if modifiedBy is not null
                        if (modifiedBy != null) {
                            //Get the ID of the modifiedBy User
                            console.log('Record Modified By User-ID: ' + modifiedBy.getId())

                            //Get the name of the modifiedBy User
                            console.log('Record Modified By User-Name: ' + modifiedBy.getName())

                            //Get the Email of the modifiedBy User
                            console.log('Record Modified By User-Email: ' + modifiedBy.getEmail())
                        }

                        //Get the ModifiedTime of each Record
                        console.log('Record ModifiedTime: ' + record.getModifiedTime())

                        //Get the list of Tag instance each Record
                        let tags = record.getTag()

                        //Check if tags is not null
                        if (tags != null) {
                            tags.forEach((tag) => {
                                //Get the Name of each Tag
                                console.log('Record Tag Name: ' + tag.getName())

                                //Get the Id of each Tag
                                console.log('Record Tag ID: ' + tag.getId())
                            })
                        }

                        //To get particular field value
                        console.log('Record Field Value: ' + record.getKeyValue('Last_Name')) // FieldApiName

                        console.log('Record KeyValues: ')

                        let keyValues = record.getKeyValues()

                        let keyArray = Array.from(keyValues.keys())

                        for (let keyName of keyArray) {
                            let value = keyValues.get(keyName)

                            if (Array.isArray(value)) {
                                if (value.length > 0) {
                                    if (value[0] instanceof FileDetails) {
                                        let fileDetails = value

                                        fileDetails.forEach((fileDetail) => {
                                            //Get the Extn of each FileDetails
                                            console.log('Record FileDetails Extn: ' + fileDetail.getExtn())

                                            //Get the IsPreviewAvailable of each FileDetails
                                            console.log('Record FileDetails IsPreviewAvailable: ' + fileDetail.getIsPreviewAvailable())

                                            //Get the DownloadUrl of each FileDetails
                                            console.log('Record FileDetails DownloadUrl: ' + fileDetail.getDownloadUrl())

                                            //Get the DeleteUrl of each FileDetails
                                            console.log('Record FileDetails DeleteUrl: ' + fileDetail.getDeleteUrl())

                                            //Get the EntityId of each FileDetails
                                            console.log('Record FileDetails EntityId: ' + fileDetail.getEntityId())

                                            //Get the Mode of each FileDetails
                                            console.log('Record FileDetails Mode: ' + fileDetail.getMode())

                                            //Get the OriginalSizeByte of each FileDetails
                                            console.log('Record FileDetails OriginalSizeByte: ' + fileDetail.getOriginalSizeByte())

                                            //Get the PreviewUrl of each FileDetails
                                            console.log('Record FileDetails PreviewUrl: ' + fileDetail.getPreviewUrl())

                                            //Get the FileName of each FileDetails
                                            console.log('Record FileDetails FileName: ' + fileDetail.getFileName())

                                            //Get the FileId of each FileDetails
                                            console.log('Record FileDetails FileId: ' + fileDetail.getFileId())

                                            //Get the AttachmentId of each FileDetails
                                            console.log('Record FileDetails AttachmentId: ' + fileDetail.getAttachmentId())

                                            //Get the FileSize of each FileDetails
                                            console.log('Record FileDetails FileSize: ' + fileDetail.getFileSize())

                                            //Get the CreatorId of each FileDetails
                                            console.log('Record FileDetails CreatorId: ' + fileDetail.getCreatorId())

                                            //Get the LinkDocs of each FileDetails
                                            console.log('Record FileDetails LinkDocs: ' + fileDetail.getLinkDocs())
                                        })
                                    } else if (value[0] instanceof Reminder) {
                                        let reminders = value

                                        reminders.forEach((reminder) => {
                                            console.log('Reminder Period: ' + reminder.getPeriod())

                                            console.log('Reminder Unit: ' + reminder.getUnit())
                                        })
                                    } else if (value[0] instanceof Choice) {
                                        let choiceArray = value

                                        console.log(keyName)

                                        console.log('Values')

                                        choiceArray.forEach((eachChoice) => {
                                            console.log(eachChoice.getValue())
                                        })
                                    } else if (value[0] instanceof Participants) {
                                        let participants = value

                                        participants.forEach((participant) => {
                                            console.log('Record Participants Name: ' + participant.getName())

                                            console.log('Record Participants Invited: ' + participant.getInvited().toString())

                                            console.log('Record Participants ID: ' + participant.getId())

                                            console.log('Record Participants Type: ' + participant.getType())

                                            console.log('Record Participants Participant: ' + participant.getParticipant())

                                            console.log('Record Participants Status: ' + participant.getStatus())
                                        })
                                    } else if (value[0] instanceof InventoryLineItems) {
                                        let productDetails = value

                                        productDetails.forEach((productDetail) => {
                                            let lineItemProduct = productDetail.getProduct()

                                            if (lineItemProduct != null) {
                                                console.log(
                                                    'Record ProductDetails LineItemProduct ProductCode: ' + lineItemProduct.getProductCode()
                                                )

                                                console.log(
                                                    'Record ProductDetails LineItemProduct Currency: ' + lineItemProduct.getCurrency()
                                                )

                                                console.log('Record ProductDetails LineItemProduct Name: ' + lineItemProduct.getName())

                                                console.log('Record ProductDetails LineItemProduct Id: ' + lineItemProduct.getId())
                                            }

                                            console.log('Record ProductDetails Quantity: ' + productDetail.getQuantity().toString())

                                            console.log('Record ProductDetails Discount: ' + productDetail.getDiscount())

                                            console.log(
                                                'Record ProductDetails TotalAfterDiscount: ' +
                                                    productDetail.getTotalAfterDiscount().toString()
                                            )

                                            console.log('Record ProductDetails NetTotal: ' + productDetail.getNetTotal().toString())

                                            if (productDetail.getBook() != null) {
                                                console.log('Record ProductDetails Book: ' + productDetail.getBook().toString())
                                            }

                                            console.log('Record ProductDetails Tax: ' + productDetail.getTax().toString())

                                            console.log('Record ProductDetails ListPrice: ' + productDetail.getListPrice().toString())

                                            console.log('Record ProductDetails UnitPrice: ' + productDetail.getUnitPrice().toString())

                                            console.log(
                                                'Record ProductDetails QuantityInStock: ' + productDetail.getQuantityInStock().toString()
                                            )

                                            console.log('Record ProductDetails Total: ' + productDetail.getTotal().toString())

                                            console.log('Record ProductDetails ID: ' + productDetail.getId())

                                            console.log(
                                                'Record ProductDetails ProductDescription: ' + productDetail.getProductDescription()
                                            )

                                            let lineTaxes = productDetail.getLineTax()

                                            lineTaxes.forEach((lineTax) => {
                                                console.log(
                                                    'Record ProductDetails LineTax Percentage: ' + lineTax.getPercentage().toString()
                                                )

                                                console.log('Record ProductDetails LineTax Name: ' + lineTax.getName())

                                                console.log('Record ProductDetails LineTax Id: ' + lineTax.getId())

                                                console.log('Record ProductDetails LineTax Value: ' + lineTax.getValue().toString())
                                            })
                                        })
                                    } else if (value[0] instanceof Tag) {
                                        let tags = value

                                        tags.forEach((tag) => {
                                            //Get the Name of each Tag
                                            console.log('Record Tag Name: ' + tag.getName())

                                            //Get the Id of each Tag
                                            console.log('Record Tag ID: ' + tag.getId())
                                        })
                                    } else if (value[0] instanceof PricingDetails) {
                                        let pricingDetails = value

                                        pricingDetails.forEach((pricingDetail) => {
                                            console.log('Record PricingDetails ToRange: ' + pricingDetail.getToRange().toString())

                                            console.log('Record PricingDetails Discount: ' + pricingDetail.getDiscount().toString())

                                            console.log('Record PricingDetails ID: ' + pricingDetail.getId())

                                            console.log('Record PricingDetails FromRange: ' + pricingDetail.getFromRange().toString())
                                        })
                                    } else if (value[0] instanceof ZCRMRecord) {
                                        let recordArray = value

                                        recordArray.forEach((record) => {
                                            Array.from(record.getKeyValues().keys()).forEach((key) => {
                                                console.log(key + ': ' + record.getKeyValues().get(key))
                                            })
                                        })
                                    } else if (value[0] instanceof LineTax) {
                                        let lineTaxes = value

                                        lineTaxes.forEach((lineTax) => {
                                            console.log('Record LineTax Percentage: ' + lineTax.getPercentage().toString())

                                            console.log('Record LineTax Name: ' + lineTax.getName())

                                            console.log('Record LineTax Id: ' + lineTax.getId())

                                            console.log('Record LineTax Value: ' + lineTax.getValue().toString())
                                        })
                                    } else if (value[0] instanceof Comment) {
                                        let comments = value

                                        comments.forEach((comment) => {
                                            console.log('Record Comment CommentedBy: ' + comment.getCommentedBy())

                                            console.log('Record Comment CommentedTime: ' + comment.getCommentedTime().toString())

                                            console.log('Record Comment CommentContent: ' + comment.getCommentContent())

                                            console.log('Record Comment Id: ' + comment.getId())
                                        })
                                    } else if (value[0] instanceof Attachment) {
                                        let attachments = value

                                        attachments.forEach((attachment) => {
                                            //Get the ID of each attachment
                                            console.log('Record Attachment ID: ' + attachment.getId())

                                            //Get the owner User instance of each attachment
                                            let owner = attachment.getOwner()

                                            //Check if owner is not null
                                            if (owner != null) {
                                                //Get the Name of the Owner
                                                console.log('Record Attachment Owner - Name: ' + owner.getName())

                                                //Get the ID of the Owner
                                                console.log('Record Attachment Owner ID: ' + owner.getId())

                                                //Get the Email of the Owner
                                                console.log('Record Attachment Owner Email: ' + owner.getEmail())
                                            }

                                            //Get the modified time of each attachment
                                            console.log('Record Attachment Modified Time: ' + attachment.getModifiedTime().toString())

                                            //Get the name of the File
                                            console.log('Record Attachment File Name: ' + attachment.getFileName())

                                            //Get the created time of each attachment
                                            console.log('Record Attachment Created Time: ' + attachment.getCreatedTime())

                                            //Get the Attachment file size
                                            console.log('Record Attachment File Size: ' + attachment.getSize())

                                            //Get the parentId Record instance of each attachment
                                            let parentId = attachment.getParentId()

                                            //Check if parentId is not null
                                            if (parentId != null) {
                                                //Get the parent record Name of each attachment
                                                console.log('Record Attachment parent record Name: ' + parentId.getKeyValue('name'))

                                                //Get the parent record ID of each attachment
                                                console.log('Record Attachment parent record ID: ' + parentId.getId())
                                            }

                                            //Check if the attachment is Editable
                                            console.log('Record Attachment is Editable: ' + attachment.getEditable().toString())

                                            //Get the file ID of each attachment
                                            console.log('Record Attachment File ID: ' + attachment.getFileId())

                                            //Get the type of each attachment
                                            console.log('Record Attachment File Type: ' + attachment.getType())

                                            //Get the seModule of each attachment
                                            console.log('Record Attachment seModule: ' + attachment.getSeModule())

                                            //Get the modifiedBy User instance of each attachment
                                            let modifiedBy = attachment.getModifiedBy()

                                            //Check if modifiedBy is not null
                                            if (modifiedBy != null) {
                                                //Get the Name of the modifiedBy User
                                                console.log('Record Attachment Modified By User-Name: ' + modifiedBy.getName())

                                                //Get the ID of the modifiedBy User
                                                console.log('Record Attachment Modified By User-ID: ' + modifiedBy.getId())

                                                //Get the Email of the modifiedBy User
                                                console.log('Record Attachment Modified By User-Email: ' + modifiedBy.getEmail())
                                            }

                                            //Get the state of each attachment
                                            console.log('Record Attachment State: ' + attachment.getState())

                                            //Get the createdBy User instance of each attachment
                                            let createdBy = attachment.getCreatedBy()

                                            //Check if createdBy is not null
                                            if (createdBy != null) {
                                                //Get the name of the createdBy User
                                                console.log('Record Attachment Created By User-Name: ' + createdBy.getName())

                                                //Get the ID of the createdBy User
                                                console.log('Record Attachment Created By User-ID: ' + createdBy.getId())

                                                //Get the Email of the createdBy User
                                                console.log('Record Attachment Created By User-Email: ' + createdBy.getEmail())
                                            }

                                            //Get the linkUrl of each attachment
                                            console.log('Record Attachment LinkUrl: ' + attachment.getLinkUrl())
                                        })
                                    } else {
                                        console.log(keyName)

                                        for (let arrayIndex = 0; arrayIndex < value.length; arrayIndex++) {
                                            const arrayValue = value[arrayIndex]

                                            console.log(arrayValue)
                                        }
                                    }
                                }
                            } else if (value instanceof ZCRMUser) {
                                console.log('Record ' + keyName + ' User-ID: ' + value.getId())

                                console.log('Record ' + keyName + ' User-Name: ' + value.getName())

                                console.log('Record ' + keyName + ' User-Email: ' + value.getEmail())
                            } else if (value instanceof ZCRMLayout) {
                                console.log(keyName + ' ID: ' + value.getId())

                                console.log(keyName + ' Name: ' + value.getName())
                            } else if (value instanceof ZCRMRecord) {
                                console.log(keyName + ' Record ID: ' + value.getId())

                                console.log(keyName + ' Record Name: ' + value.getKeyValue('name'))
                            } else if (value instanceof Choice) {
                                console.log(keyName + ': ' + value.getValue())
                            } else if (value instanceof RemindAt) {
                                console.log(keyName + ': ' + value.getAlarm())
                            } else if (value instanceof RecurringActivity) {
                                console.log(keyName)

                                console.log('RRULE: ' + value.getRrule())
                            } else if (value instanceof Consent) {
                                console.log('Record Consent ID: ' + value.getId())

                                //Get the Owner User instance of each attachment
                                let owner = value.getOwner()

                                //Check if owner is not null
                                if (owner != null) {
                                    //Get the name of the owner User
                                    console.log('Record Consent Owner Name: ' + owner.getName())

                                    //Get the ID of the owner User
                                    console.log('Record Consent Owner ID: ' + owner.getId())

                                    //Get the Email of the owner User
                                    console.log('Record Consent Owner Email: ' + owner.getEmail())
                                }

                                let consentCreatedBy = value.getCreatedBy()

                                //Check if createdBy is not null
                                if (consentCreatedBy != null) {
                                    //Get the name of the CreatedBy User
                                    console.log('Record Consent CreatedBy Name: ' + consentCreatedBy.getName())

                                    //Get the ID of the CreatedBy User
                                    console.log('Record Consent CreatedBy ID: ' + consentCreatedBy.getId())

                                    //Get the Email of the CreatedBy User
                                    console.log('Record Consent CreatedBy Email: ' + consentCreatedBy.getEmail())
                                }

                                let consentModifiedBy = value.getModifiedBy()

                                //Check if createdBy is not null
                                if (consentModifiedBy != null) {
                                    //Get the name of the ModifiedBy User
                                    console.log('Record Consent ModifiedBy Name: ' + consentModifiedBy.getName())

                                    //Get the ID of the ModifiedBy User
                                    console.log('Record Consent ModifiedBy ID: ' + consentModifiedBy.getId())

                                    //Get the Email of the ModifiedBy User
                                    console.log('Record Consent ModifiedBy Email: ' + consentModifiedBy.getEmail())
                                }

                                console.log('Record Consent CreatedTime: ' + value.getCreatedTime())

                                console.log('Record Consent ModifiedTime: ' + value.getModifiedTime())

                                console.log('Record Consent ContactThroughEmail: ' + value.getContactThroughEmail())

                                console.log('Record Consent ContactThroughSocial: ' + value.getContactThroughSocial())

                                console.log('Record Consent ContactThroughSurvey: ' + value.getContactThroughSurvey())

                                console.log('Record Consent ContactThroughPhone: ' + value.getContactThroughPhone())

                                console.log('Record Consent MailSentTime: ' + value.getMailSentTime().toString())

                                console.log('Record Consent ConsentDate: ' + value.getConsentDate().toString())

                                console.log('Record Consent ConsentRemarks: ' + value.getConsentRemarks())

                                console.log('Record Consent ConsentThrough: ' + value.getConsentThrough())

                                console.log('Record Consent DataProcessingBasis: ' + value.getDataProcessingBasis())

                                //To get custom values
                                console.log('Record Consent Lawful Reason: ' + value.getKeyValue('Lawful_Reason'))
                            } else if (value instanceof Map) {
                                console.log(keyName)

                                Array.from(value.keys()).forEach((key) => {
                                    console.log(key + ': ' + value.get(key))
                                })
                            } else {
                                console.log(keyName + ': ' + value)
                            }
                        }
                    }

                    //Get the obtained Info instance
                    let info = responseObject.getInfo()

                    if (info != null) {
                        if (info.getPerPage() != null) {
                            //Get the PerPage of the Info
                            console.log('Record Info PerPage: ' + info.getPerPage().toString())
                        }

                        if (info.getCount() != null) {
                            //Get the Count of the Info
                            console.log('Record Info Count: ' + info.getCount().toString())
                        }

                        if (info.getPage() != null) {
                            //Get the Page of the Info
                            console.log('Record Info Page: ' + info.getPage().toString())
                        }

                        if (info.getMoreRecords() != null) {
                            //Get the MoreRecords of the Info
                            console.log('Record Info MoreRecords: ' + info.getMoreRecords().toString())
                        }
                    }
                }
                //Check if the request returned an exception
                else if (responseObject instanceof APIException) {
                    //Get the Status
                    console.log('Status: ' + responseObject.getStatus().getValue())

                    //Get the Code
                    console.log('Code: ' + responseObject.getCode().getValue())

                    console.log('Details')

                    //Get the details map
                    let details = responseObject.getDetails()

                    if (details != null) {
                        Array.from(details.keys()).forEach((key) => {
                            console.log(key + ': ' + details.get(key))
                        })
                    }

                    //Get the Message
                    console.log('Message: ' + responseObject.getMessage().getValue())
                }
            }
        }
    }
}
module.exports = { Record }
