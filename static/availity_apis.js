// Declarative definition of every API + operation the tester knows about.
// The UI is generated from this file. Add fields/operations here to extend it.

const SR_SAMPLE_BODY = {
  payer: {
    name: "AETNA",
    id: "AETNA"
  },
  requestingProvider: {
    lastName: "PROVIDERONE",
    firstName: "TEST",
    npi: "1234567893",
    roleCode: "1P",
    addressLine1: "100 MAIN ST",
    city: "NEW YORK",
    stateCode: "NY",
    zipCode: "10001",
    contactName: "TEST PROVIDER",
    phone: "5555555555"
  },
  subscriber: {
    firstName: "JOHN",
    lastName: "DOE",
    memberId: "TEST123456789",
    addressLine1: "123 MAIN ST",
    city: "ANYTOWN",
    stateCode: "PA",
    zipCode: "17000"
  },
  patient: {
    firstName: "JOHN",
    lastName: "DOE",
    subscriberRelationshipCode: "18",
    birthDate: "1980-01-01T05:00:00.000+0000",
    genderCode: "M",
    addressLine1: "123 MAIN ST",
    city: "ANYTOWN",
    stateCode: "PA",
    zipCode: "17000"
  },
  diagnoses: [
    {
      qualifierCode: "ABK",
      code: "D64.81",
      date: "2026-06-11T05:00:00.000+0000"
    }
  ],
  procedures: [
    {
      code: "J0881",
      qualifierCode: "HC",
      description: "Aranesp non-esrd SQ",
      fromDate: "2026-06-11",
      serviceQuantity: "365",
      serviceQuantityTypeCode: "DY"
    }
  ],
  requestTypeCode: "HS",
  placeOfServiceCode: "11",
  fromDate: "2026-06-11T05:00:00.000+0000",
  renderingProviders: [
    {
      lastName: "PROVIDERTWO",
      firstName: "TEST",
      npi: "9876543213",
      roleCode: "71",
      addressLine1: "100 MAIN ST",
      city: "NEW YORK",
      stateCode: "NY",
      zipCode: "10001"
    }
  ]
};

// Auth Attachments body: an `attachments` array + a `serviceReview` object
// (mirrors the Service Reviews request body). Source: Availity Service Reviews
// Add-On docs (Attachments 2.0.0).
const AUTH_ATTACH_SAMPLE = {
  attachments: [{
    attachmentTypeCode: "M1",
    contentType: "application/PDF",
    title: "test_clinical_doc.pdf",
    data: "BASE64_ENCODED_FILE_CONTENT",
    size: "584",
    creation: "2026-03-05"
  }],
  serviceReview: {
    referenceNumber: "",
    payer: { id: "BCBSF" },
    requestTypeCode: "HS",
    placeOfServiceCode: "22",
    fromDate: "2026-01-05",
    toDate: "2026-01-05",
    quantity: "1",
    quantityTypeCode: "DA",
    requestingProvider: { lastName: "PROVIDERONE", firstName: "TEST", npi: "1234567891", contactName: "Health Plan Test", phone: "5555555555" },
    subscriber: { memberId: "123456789" },
    patient: { birthDate: "1990-01-01" },
    diagnoses: [{ qualifierCode: "ABK", code: "Z77.22" }],
    procedures: [{ qualifierCode: "HC", code: "99223", fromDate: "2026-01-05", toDate: "2026-01-05", serviceQuantity: "1", serviceQuantityTypeCode: "DY", quantityTypeCode: "DA" }],
    renderingProviders: [{ roleCode: "71", lastName: "PROVIDERTWO", firstName: "TEST", npi: "987654321" }]
  }
};

// Claim Attachments body. Source: Availity Claim Attachments 1.0.0 docs (the
// real request shape: payer/submitter/product/patient/subscriber/provider/
// encounter/payloads). Put real base64 file content in payloads[].contents[].data.
const CLAIM_ATTACH_SAMPLE = {
  payer: { id: "68069", displayName: "Health Plan One" },
  submitter: { id: "477823", state: "TX", displayName: "NXGEN MDX" },
  product: { type: "CLAIM", category: "MEDICAL" },
  patient: { lastName: "Ochoa", firstName: "Blanca", dateOfBirth: "2004-11-03", memberNumber: "524845471", accountNumber: "NXGMDX-1236885" },
  subscriber: { lastName: "Ochoa", firstName: "Blanca", dateOfBirth: "2004-11-03", memberNumber: "524845471", accountNumber: "NXGMDX-1236885" },
  provider: { lastName: "Nxgen MDX", npi: "1234567893" },
  encounter: { serviceFrom: "2021-06-24", serviceTo: "2021-06-24", requestNumber: "RN85363437337111" },
  payloads: [{
    contents: [{
      reasonCodes: [{ value: "76438-1", codeType: "LOINC" }],
      filename: "test.pdf",
      contentType: { type: "application", subtype: "pdf" },
      data: "BASE64_ENCODED_FILE_CONTENT"
    }]
  }]
};

// IsAuthRequired body: wraps a full Service Reviews request in `serviceReview`.
// Source: Availity Service Reviews Add-On docs (IsAuthRequired 2.0.0).
const ISAUTH_SAMPLE = {
  serviceReview: {
    payer: { id: "99999" },
    requestingProvider: { lastName: "PROVIDERONE", firstName: "TEST", npi: "1234567891", taxId: "111111111", addressLine1: "111 HEALTHY PKWY", city: "JACKSONVILLE", stateCode: "FL", zipCode: "22222", phone: "1234567890", contactName: "NURSE LINE", roleCode: "1P" },
    subscriber: { memberId: "NCF103T99937" },
    patient: { firstName: "TEST", lastName: "PATIENTONE", subscriberRelationshipCode: "18", birthDate: "1990-01-01" },
    diagnoses: [{ qualifierCode: "ABK", code: "A52.00" }],
    requestTypeCode: "HS",
    serviceTypeCode: "73",
    placeOfServiceCode: "22",
    serviceLevelCode: "E",
    fromDate: "2022-09-02",
    toDate: "2022-09-13",
    quantity: "1",
    quantityTypeCode: "VS",
    procedures: [{ fromDate: "2022-09-02", toDate: "2022-09-13", code: "99242", qualifierCode: "HC", quantity: "1", quantityTypeCode: "UN" }],
    renderingProviders: [{ lastName: "PROVIDERONE", firstName: "TEST", npi: "1234567891", taxId: "111111111", roleCode: "71", addressLine1: "111 HEALTHY PKWY", city: "JACKSONVILLE", stateCode: "FL", zipCode: "22222" }]
  }
};

export const APIS = [
  {
    id: "coverages",
    name: "Eligibility & Benefits (Coverages)",
    transaction: "X12 270/271",
    blurb: "Real-time eligibility & benefits. Is the patient covered, and what are the benefits? Async: POST returns 202, then poll GET by id until statusCode 4 (Complete).",
    operations: [
      {
        id: "create", label: "Submit inquiry", method: "POST", path: "/availity/v1/coverages",
        bodyType: "form", async: true,
        demoScenarios: ["Coverages-Complete-i", "Coverages-PayerError1-i", "Coverages-PayerError2-i", "Coverages-InProgress-i", "Coverages-Retrying-i", "Coverages-RequestError1-i", "Coverages-RequestError2-i"],
        sample: { fields: { payerId: "123", providerNpi: "123", providerLastName: "ABC", asOfDate: "1990-01-01", "serviceType[]": "30", memberId: "ABC123", patientFirstName: "FIRST", patientLastName: "LAST", patientBirthDate: "1900-01-01", patientGender: "M", patientState: "FL", subscriberRelationship: "18" } },
        fields: [
          { name: "payerId", default: "16146" },
          { name: "providerNpi", default: "1760486443" },
          { name: "providerLastName", default: "ABC" },
          { name: "asOfDate", default: "2026-05-21" },
          { name: "serviceType[]", label: "serviceType", default: "78" },
          { name: "memberId", default: "FQ02479W" },
          { name: "patientFirstName", default: "NAZNIN" },
          { name: "patientLastName", default: "SULTANA" },
          { name: "patientBirthDate", default: "1970-06-05" },
          { name: "patientGender", default: "M" },
          { name: "patientState", default: "NY" },
          { name: "subscriberRelationship", default: "18", hint: "18=Self 01=Spouse 19=Child G8=Other" },
        ],
      },
      { id: "get", label: "Get by ID", method: "GET", path: "/availity/v1/coverages/{id}", pathParams: [{ name: "id", default: "" }], async: false, demoScenarios: ["Coverages-Complete-i", "Coverages-InProgress-i"], sample: { pathParams: { id: "1234567890" } } },
    ],
  },
  {
    id: "claim-status",
    name: "Claim Status",
    transaction: "X12 276/277",
    blurb: "Check the status of an already-submitted claim. NOTE: the POST requires the header X-HTTP-Method-Override: GET (added automatically here). No demo mock scenarios are published for this API.",
    operations: [
      {
        id: "create", label: "Initiate inquiry", method: "POST", path: "/availity/v1/claim-statuses",
        bodyType: "form", async: true,
        extraHeaders: { "X-HTTP-Method-Override": "GET" },
        demoScenarios: [],
        sample: { fields: { "payer.id": "BCBSF", "submitter.id": "SUBMITTERID", "submitter.lastName": "SUBMITTERLASTNAME", "submitter.firstName": "SUBMITTERFIRSTNAME", "providers.npi": "1234567893", "providers.taxId": "", "providers.lastName": "PROVIDERLASTNAME", "subscriber.memberId": "ABC123456789", "subscriber.lastName": "SUBSCRIBERLASTNAME", "patient.firstName": "PATIENTFIRSTNAME", "patient.lastName": "PATIENTLASTNAME", "patient.birthDate": "1999-09-09", "patient.subscriberRelationshipCode": "01", "requestType": "HIPAA_276", "fromDate": "2025-05-15", "toDate": "2025-05-19" } },
        fields: [
          { name: "payer.id", default: "101" },
          { name: "submitter.id", default: "availity" },
          { name: "submitter.lastName", default: "availity" },
          { name: "submitter.firstName", default: "Lindsay" },
          { name: "providers.npi", default: "1437152691" },
          { name: "providers.taxId", default: "621647259" },
          { name: "providers.lastName", default: "Krueger MD" },
          { name: "subscriber.memberId", default: "LKW907465116" },
          { name: "subscriber.lastName", default: "Kixmiller" },
          { name: "patient.firstName", default: "Donna R" },
          { name: "patient.lastName", default: "Scott" },
          { name: "patient.birthDate", default: "1961-11-11" },
          { name: "patient.subscriberRelationshipCode", default: "18", hint: "18=Self 01=Spouse 19=Child G8=Other" },
          { name: "requestType", default: "HIPAA_276" },
          { name: "fromDate", default: "2024-08-23" },
          { name: "toDate", default: "2024-08-23" },
        ],
      },
      { id: "get", label: "Get by ID", method: "GET", path: "/availity/v1/claim-statuses/{id}", pathParams: [{ name: "id", default: "" }], sample: { pathParams: { id: "5334032768852043884" } } },
    ],
  },
  {
    id: "service-reviews",
    name: "Service Reviews 2.0",
    transaction: "X12 278",
    blurb: "Prior authorizations & referrals (X12 278). Submit a request (POST), search existing reviews (GET), or inquire one by id (GET by id). requestTypeCode: AR=inpatient, HS=outpatient, SC=referral. Async: POST returns 202 + an id; the app auto-polls GET by id until the payer responds (statusCode 4 = Complete).",
    operations: [
      {
        id: "create", label: "Submit auth/referral", method: "POST", path: "/availity/v2/service-reviews",
        bodyType: "json", async: true,
        demoScenarios: ["SR-CreateRequestAccepted-i", "SR-CreateRequestError-i"],
        jsonDefault: SR_SAMPLE_BODY,
      },
      {
        id: "search", label: "Search", method: "GET", path: "/availity/v2/service-reviews", async: true,
        demoScenarios: ["SRI-GetComplete-i", "SRI-GetAccepted-i", "SRI-GetInProgress-i", "SRI-GetPayerError-i", "SRI-GetPayerDown-i"],
        sample: { query: { payerId: "AETNA", patientLastName: "DOE", memberId: "TEST123456789" } },
        queryFields: [
          { name: "payerId", default: "AETNA" },
          { name: "patientLastName", default: "DOE" },
          { name: "memberId", default: "TEST123456789" },
        ],
      },
      {
        id: "get", label: "Get by ID (inquiry)", method: "GET", path: "/availity/v2/service-reviews/{id}",
        pathParams: [{ name: "id", default: "12345678" }],
        demoScenarios: ["SR-GetComplete-i", "SR-GetInProgress-i", "SR-GetRetrying-i", "SR-GetPayerDown-i", "SR-GetPayerError-i"],
        sample: { pathParams: { id: "00012334110147861604667155757587374114129045756512963141509096868" } },
      },
    ],
  },
  {
    id: "isauthrequired",
    name: "IsAuthRequired",
    transaction: "Service Reviews add-on",
    unavailable: true,
    blurb: "Ask whether a payer requires prior authorization for a service before you submit it. The body wraps a full Service Reviews request in `serviceReview`; the response procedures[].status shows Auth Required / No Auth Required. Async: POST then GET by id to poll. NOTE: Availity lists this API as 'Currently Unavailable', and docs show internal routing prefixes \u2014 if you get 404, edit the path (the editable field above the form).",
    operations: [
      { id: "create", label: "Check if auth required", method: "POST", path: "/value-adds/v1/isauthrequired", bodyType: "json", async: true, jsonDefault: ISAUTH_SAMPLE },
      { id: "get", label: "Get result by ID", method: "GET", path: "/value-adds/v1/isauthrequired/{id}", pathParams: [{ name: "id", default: "00012345678910" }], sample: { pathParams: { id: "00012345678910" } } },
    ],
  },
  {
    id: "auth-attachments",
    name: "Attachments \u2013 Auth (Service Reviews)",
    transaction: "Service Reviews add-on",
    unavailable: true,
    blurb: "Attach supporting documents to an authorization, and check the attachment status. Body = an attachments[] array + a serviceReview object. Replace base64 data with a real encoded file. Async: 202 + Location, then poll. NOTE: Availity lists this API as 'Currently Unavailable' \u2014 if you get 404, edit the path field above the form.",
    operations: [
      { id: "create", label: "Submit attachment", method: "POST", path: "/value-adds/v2/attachments", bodyType: "json", async: true, jsonDefault: AUTH_ATTACH_SAMPLE },
      { id: "get", label: "Get status by ID", method: "GET", path: "/value-adds/v2/attachments/{id}", pathParams: [{ name: "id", default: "" }], sample: { pathParams: { id: "16536719344950000248823246346246" } } },
    ],
  },
  {
    id: "claim-attachments",
    name: "Attachments \u2013 Claim (Medical)",
    transaction: "X12 275",
    blurb: "Submit medical claim attachments (clearinghouse workflow), and check status by requestId. POST returns { id }; use it for the status GET. Replace base64 data with a real encoded file. NOTE: do NOT submit test data in production.",
    operations: [
      { id: "create", label: "Submit attachment", method: "POST", path: "/availity/medical-attachments/ma/external/rest/response", bodyType: "json", async: true, jsonDefault: CLAIM_ATTACH_SAMPLE },
      { id: "get", label: "Get status by requestId", method: "GET", path: "/availity/medical-attachments/ma/external/rest/status/{requestId}", pathParams: [{ name: "requestId", default: "" }], sample: { pathParams: { requestId: "16536719344950000248823246346246" } } },
    ],
  },
  {
    id: "payer-list",
    name: "Payer List (helper)",
    transaction: "utility",
    blurb: "List payers and which transactions each supports. Use this to find valid payerId values for the other APIs.",
    operations: [
      {
        id: "list", label: "List payers", method: "GET", path: "/availity/v1/availity-payer-list",
        sample: { query: { payerId: "PAY000001", transactionType: "837P", limit: "2", offset: "0" } },
        queryFields: [
          { name: "payerId", default: "PAY000001" },
          { name: "transactionType", default: "270", hint: "270, 276, 278I, 837P, 837I, 837D ..." },
          { name: "limit", default: "10" },
          { name: "offset", default: "0" },
        ],
      },
    ],
  },
  {
    id: "configurations",
    name: "Configurations (helper)",
    transaction: "utility",
    blurb: "Per-payer required fields, allowed values, and validation patterns. Call this to learn what a specific payer needs for Coverages / Service Reviews / etc.",
    operations: [
      {
        id: "get", label: "Get configuration", method: "GET", path: "/availity/v1/configurations",
        queryFields: [
          { name: "type", default: "270", hint: "270, service-reviews, claim-statuses-inquiry, professional-claims, enhanced-claim-status" },
          { name: "subtypeId", default: "", hint: "HS / AR / SC / PRE_DETERMINATION ..." },
          { name: "payerId", default: "16146" },
        ],
      },
    ],
  },
];
