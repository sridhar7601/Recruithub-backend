# RecruitHub API Flow Documentation

This document provides a comprehensive guide to the RecruitHub API flows, explaining the complete process from college creation to student evaluation. It's designed to help new developers understand how the different APIs work together in the recruitment process.

## Table of Contents

1. [College Management](#college-management)
2. [Drive Management](#drive-management)
3. [Panel Management](#panel-management)
4. [Student Management](#student-management)
5. [Assignment Management](#assignment-management)
6. [Student Round Evaluation](#student-round-evaluation)
7. [Complete API Flow Example](#complete-api-flow-example)

## College Management

### Create a College

**Endpoint:** `POST /colleges`

**Description:** Creates a new college in the system.

**Request:**
```http
POST {{baseUrl}}/colleges
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
    "name": "Harvard University",
    "city": "Cambridge"
}
```

**Response:**
```json
{
    "collegeId": "college-uuid",
    "name": "Harvard University",
    "city": "Cambridge",
    "isActive": true,
    "createdAt": "2025-04-07T07:27:45.123Z",
    "updatedAt": "2025-04-07T07:27:45.123Z"
}
```

### Get College Details

**Endpoint:** `GET /colleges/:collegeId`

**Description:** Retrieves details of a specific college.

**Request:**
```http
GET {{baseUrl}}/colleges/{{collegeId}}
Authorization: Bearer {{apiKey}}
```

## Drive Management

### Create a Drive with Rounds

**Endpoint:** `POST /drives`

**Description:** Creates a new recruitment drive at a college with evaluation rounds.

**Request:**
```http
POST {{baseUrl}}/drives
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
    "name": "Summer 2025 Recruitment Drive",
    "collegeId": "{{collegeId}}",
    "collegeName": "Harvard University",
    "role": "Associate Engineer",
    "practice": "Application Development",
    "startDate": "2025-06-15T09:00:00Z",
    "primarySpocId": "{{primarySpocId}}",
    "primarySpocEmail": "primary.spoc@example.com",
    "primarySpocName": "John Doe",
    "secondarySpocs": [
        {
            "spocId": "{{secondarySpocId}}",
            "spocEmail": "secondary.spoc@example.com",
            "spocName": "Jane Smith"
        }
    ],
    "isPinned": false,
    "isCompleted": false,
    "rounds": [
        {
            "roundNumber": 1,
            "name": "Initial Assessment",
            "startTime": "2025-06-15T09:00:00Z",
            "endTime": "2025-06-15T12:00:00Z",
            "evaluationCriteria": [
                {
                    "name": "WECP Percentage",
                    "description": "Online aptitude test score",
                    "ratingType": "percentage",
                    "isRequired": true
                }
            ]
        },
        {
            "roundNumber": 2,
            "name": "Technical Round",
            "startTime": "2025-06-16T09:00:00Z",
            "endTime": "2025-06-16T17:00:00Z",
            "evaluationCriteria": [
                {
                    "name": "Problem Solving",
                    "description": "Ability to solve complex problems",
                    "ratingType": "scale-5",
                    "isRequired": true
                },
                {
                    "name": "Logical Thinking",
                    "description": "Logical and structured approach",
                    "ratingType": "scale-5",
                    "isRequired": true
                },
                {
                    "name": "Technical Feedback",
                    "description": "Overall technical assessment",
                    "ratingType": "text",
                    "isRequired": false
                }
            ]
        }
    ]
}
```

**Response:**
```json
{
    "driveId": "drive-uuid",
    "name": "Summer 2025 Recruitment Drive",
    "collegeId": "college-uuid",
    "collegeName": "Harvard University",
    "role": "Associate Engineer",
    "practice": "Application Development",
    "startDate": "2025-06-15T09:00:00Z",
    "primarySpocId": "primary-spoc-uuid",
    "primarySpocEmail": "primary.spoc@example.com",
    "primarySpocName": "John Doe",
    "secondarySpocs": [...],
    "isPinned": false,
    "isCompleted": false,
    "rounds": [...],
    "isActive": true,
    "createdAt": "2025-04-07T07:30:12.456Z",
    "updatedAt": "2025-04-07T07:30:12.456Z"
}
```

### Get Drive Details with Rounds

**Endpoint:** `GET /drives/:driveId`

**Description:** Retrieves drive details including rounds configuration.

**Request:**
```http
GET {{baseUrl}}/drives/{{driveId}}?includeRounds=true
Authorization: Bearer {{apiKey}}
```

### Create Round

**Endpoint:** `POST /drives/:driveId/rounds`

**Description:** Creates a new round for a drive.

**Request:**
```http
POST {{baseUrl}}/drives/{{driveId}}/rounds
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
    "roundNumber": 3,
    "name": "HR Round",
    "startTime": "2025-06-17T09:00:00Z",
    "endTime": "2025-06-17T17:00:00Z",
    "evaluationCriteria": [
        {
            "name": "Communication Skills",
            "description": "Ability to communicate effectively",
            "ratingType": "scale-5",
            "isRequired": true
        },
        {
            "name": "Cultural Fit",
            "description": "Alignment with company values",
            "ratingType": "scale-5",
            "isRequired": true
        },
        {
            "name": "HR Feedback",
            "description": "Overall HR assessment",
            "ratingType": "text",
            "isRequired": false
        }
    ]
}
```

## Panel Management

### Create Panel

**Endpoint:** `POST /panels`

**Description:** Creates a new panel for evaluating students.

**Request:**
```http
POST {{baseUrl}}/panels
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
    "primaryPanelMember": {
        "employeeId": "EMP001",
        "emailId": "primary@example.com",
        "name": "John Doe"
    },
    "additionalPanelMembers": [
        {
            "employeeId": "EMP002",
            "emailId": "member1@example.com",
            "name": "Jane Smith"
        }
    ],
    "name": "Test Panel"
}
```

**Response:**
```json
{
    "panelId": "panel-uuid",
    "primaryPanelMember": {
        "employeeId": "EMP001",
        "emailId": "primary@example.com",
        "name": "John Doe"
    },
    "additionalPanelMembers": [
        {
            "employeeId": "EMP002",
            "emailId": "member1@example.com",
            "name": "Jane Smith"
        }
    ],
    "name": "Test Panel",
    "isActive": true,
    "createdAt": "2025-04-07T07:40:22.123Z",
    "updatedAt": "2025-04-07T07:40:22.123Z"
}
```

### Get All Panels

**Endpoint:** `GET /panels`

**Description:** Retrieves a paginated list of panels.

**Request:**
```http
GET {{baseUrl}}/panels?page=1&limit=10
Authorization: Bearer {{apiKey}}
```

### Get Panel by ID

**Endpoint:** `GET /panels/:panelId`

**Description:** Retrieves a panel by ID.

**Request:**
```http
GET {{baseUrl}}/panels/{{panelId}}
Authorization: Bearer {{apiKey}}
```

### Update Panel

**Endpoint:** `PUT /panels/:panelId`

**Description:** Updates a panel's information.

**Request:**
```http
PUT {{baseUrl}}/panels/{{panelId}}
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
    "additionalPanelMembers": [
        {
            "employeeId": "EMP003",
            "emailId": "member2@example.com",
            "name": "Bob Johnson"
        }
    ],
    "name": "Updated Test Panel"
}
```

## Student Management

### Create Individual Student

**Endpoint:** `POST /students`

**Description:** Creates a student with automatic round initialization based on the drive configuration.

**Request:**
```http
POST {{baseUrl}}/students
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "registrationNumber": "REG001",
  "emailId": "student@example.com",
  "name": "John Student",
  "phoneNumber": "1234567890",
  "degree": "B.Tech - Computer Science",
  "department": "Computer Science",
  "gender": "Male",
  "dateOfBirth": "2000-01-15",
  "githubProfile": "https://github.com/student",
  "linkedInProfile": "https://linkedin.com/in/student",
  "resumeUrl": "https://drive.google.com/file/resume",
  "leetCodeProfile": "https://leetcode.com/student",
  "academicDetails": {
    "tenthMarks": "95%",
    "twelfthMarks": "92%",
    "diplomaMarks": "",
    "ugMarks": "8.7 CGPA",
    "pgMarks": ""
  },
  "backlogHistory": "None",
  "currentBacklogs": 0,
  "aiScore": {
    "total": 85,
    "components": {
      "github": { "fullStack": 80, "aiml": 70, "contribution": 75 },
      "resume": {
        "fullStack": { "frontend": 85, "backend": 80, "database": 75, "infrastructure": 70 },
        "aiml": { "core": 65, "genai": 60 }
      }
    },
    "expertise": { "fullStack": "MEDIUM", "aiml": "LOW" }
  },
  "wecpTestScore": 78,
  "githubDetails": {
    "totalScore": 82,
    "domainScore": 80,
    "contributionScore": 75,
    "domains": "{\"frontend\": true, \"backend\": true}",
    "technologies": "React, Node.js, MongoDB"
  },
  "testBatch": "Batch 1",
  "collegeId": "{{collegeId}}",
  "collegeName": "Example College",
  "driveId": "{{driveId}}",
  "driveName": "Example Drive"
}
```

**Response:**
```json
{
  "studentId": "student-uuid",
  "registrationNumber": "REG001",
  "emailId": "student@example.com",
  "name": "John Student",
  "department": "Computer Science",
  "testBatch": "Batch 1",
  "collegeId": "college-uuid",
  "collegeName": "Harvard University",
  "driveId": "drive-uuid",
  "driveName": "Summer 2025 Recruitment Drive",
  "rounds": [
    {
      "roundNumber": 1,
      "name": "Initial Assessment",
      "evaluationCriteria": [
        {
          "criteriaId": "criteria-uuid-1",
          "name": "WECP Percentage",
          "description": "Online aptitude test score",
          "ratingType": "percentage",
          "isRequired": true,
          "value": null,
          "feedback": null
        }
      ],
      "status": "NOT_STARTED",
      "notes": null,
      "overallRating": null,
      "evaluatedBy": null,
      "evaluationStartTime": null,
      "evaluationEndTime": null
    },
    {
      "roundNumber": 2,
      "name": "Technical Round",
      "evaluationCriteria": [...],
      "status": "NOT_STARTED",
      "notes": null,
      "overallRating": null,
      "evaluatedBy": null,
      "evaluationStartTime": null,
      "evaluationEndTime": null
    }
  ],
  "isActive": true,
  "createdAt": "2025-04-07T07:35:22.789Z",
  "updatedAt": "2025-04-07T07:35:22.789Z"
}
```

### Get All Students

**Endpoint:** `GET /students`

**Description:** Retrieves a paginated list of students with optional filters.

**Request:**
```http
GET {{baseUrl}}/students?page=1&limit=10&collegeId={{collegeId}}&driveId={{driveId}}&department=Computer Science&testBatch=Batch 1
Authorization: Bearer {{apiKey}}
```

### Get Student by ID

**Endpoint:** `GET /students/:studentId`

**Description:** Retrieves a student by ID.

**Request:**
```http
GET {{baseUrl}}/students/{{studentId}}
Authorization: Bearer {{apiKey}}
```

### Update Student

**Endpoint:** `PUT /students/:studentId`

**Description:** Updates a student's information.

**Request:**
```http
PUT {{baseUrl}}/students/{{studentId}}
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "githubProfile": "https://github.com/updated-student",
  "aiScore": {
    "total": 90,
    "components": {
      "github": { "fullStack": 85, "aiml": 75, "contribution": 80 },
      "resume": {
        "fullStack": { "frontend": 90, "backend": 85, "database": 80, "infrastructure": 75 },
        "aiml": { "core": 70, "genai": 65 }
      }
    },
    "expertise": { "fullStack": "HIGH", "aiml": "MEDIUM" }
  },
  "wecpTestScore": 85
}
```

### Batch Import Students

**Endpoint:** `POST /students/import/:driveId`

**Description:** Imports multiple students from an Excel file.

**Request:**
```http
POST {{baseUrl}}/students/import/{{driveId}}
Content-Type: multipart/form-data
Authorization: Bearer {{apiKey}}

file: [Excel file with student data]
```

## Assignment Management

### Create Assignment

**Endpoint:** `POST /assignments`

**Description:** Creates a new assignment linking a student to a panel for evaluation.

**Request:**
```http
POST {{baseUrl}}/assignments
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "studentId": "{{studentId}}",
  "studentName": "John Doe",
  "registrationNumber": "REG123",
  "emailId": "john@example.com",
  "collegeId": "{{collegeId}}",
  "collegeName": "Example College",
  "driveId": "{{driveId}}",
  "driveName": "Summer Internship Drive",
  "panelId": "{{panelId}}",
  "primaryPanelMember": {
    "employeeId": "EMP001",
    "emailId": "interviewer@company.com",
    "name": "Jane Smith"
  },
  "additionalPanelMembers": [],
  "roundNumber": 1,
  "assignedBy": {
    "employeeId": "EMP002",
    "name": "Admin User",
    "emailId": "admin@company.com"
  },
  "assignedTimestamp": "{{$isoTimestamp}}"
}
```

**Response:**
```json
{
  "assignmentId": "assignment-uuid",
  "studentId": "student-uuid",
  "studentName": "John Doe",
  "registrationNumber": "REG123",
  "emailId": "john@example.com",
  "collegeId": "college-uuid",
  "collegeName": "Example College",
  "driveId": "drive-uuid",
  "driveName": "Summer Internship Drive",
  "panelId": "panel-uuid",
  "primaryPanelMember": {
    "employeeId": "EMP001",
    "emailId": "interviewer@company.com",
    "name": "Jane Smith"
  },
  "additionalPanelMembers": [],
  "roundNumber": 1,
  "assignedBy": {
    "employeeId": "EMP002",
    "name": "Admin User",
    "emailId": "admin@company.com"
  },
  "assignedTimestamp": "2025-04-07T07:45:22.123Z",
  "isActive": true,
  "createdAt": "2025-04-07T07:45:22.123Z",
  "updatedAt": "2025-04-07T07:45:22.123Z"
}
```

### Get All Assignments

**Endpoint:** `GET /assignments`

**Description:** Retrieves a paginated list of assignments.

**Request:**
```http
GET {{baseUrl}}/assignments?page=1&limit=10
Authorization: Bearer {{apiKey}}
```

### Get Assignment by ID

**Endpoint:** `GET /assignments/:assignmentId`

**Description:** Retrieves an assignment by ID.

**Request:**
```http
GET {{baseUrl}}/assignments/{{assignmentId}}
Authorization: Bearer {{apiKey}}
```

### Update Assignment

**Endpoint:** `PUT /assignments/:assignmentId`

**Description:** Updates an assignment's information.

**Request:**
```http
PUT {{baseUrl}}/assignments/{{assignmentId}}
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "panelId": "{{newPanelId}}",
  "roundNumber": 2
}
```

## Student Round Evaluation

### Get Student Rounds

**Endpoint:** `GET /students/:studentId/rounds`

**Description:** Retrieves all rounds for a student.

**Request:**
```http
GET {{baseUrl}}/students/{{studentId}}/rounds
Authorization: Bearer {{apiKey}}
```

**Response:**
```json
[
  {
    "roundNumber": 1,
    "name": "Initial Assessment",
    "evaluationCriteria": [...],
    "status": "NOT_STARTED",
    "notes": null,
    "overallRating": null,
    "evaluatedBy": null,
    "evaluationStartTime": null,
    "evaluationEndTime": null
  },
  {
    "roundNumber": 2,
    "name": "Technical Round",
    "evaluationCriteria": [...],
    "status": "NOT_STARTED",
    "notes": null,
    "overallRating": null,
    "evaluatedBy": null,
    "evaluationStartTime": null,
    "evaluationEndTime": null
  }
]
```

### Get Student Round by Number

**Endpoint:** `GET /students/:studentId/rounds/:roundNumber`

**Description:** Retrieves a specific round for a student.

**Request:**
```http
GET {{baseUrl}}/students/{{studentId}}/rounds/{{roundNumber}}
Authorization: Bearer {{apiKey}}
```

### Update Student Round

**Endpoint:** `PUT /students/:studentId/rounds/:roundNumber`

**Description:** Updates a specific round for a student.

**Request:**
```http
PUT {{baseUrl}}/students/{{studentId}}/rounds/{{roundNumber}}
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "status": "IN_PROGRESS",
  "evaluatedBy": {
    "employeeId": "emp123",
    "name": "Jane Smith",
    "emailId": "jane.smith@company.com"
  },
  "evaluationStartTime": "2025-04-16T10:00:00Z",
  "evaluationCriteria": [
    {
      "criteriaId": "criteria-uuid-1",
      "value": 85,
      "feedback": "Good aptitude performance"
    }
  ],
  "notes": "Candidate performed well in the online assessment"
}
```

**Response:**
```json
{
  "studentId": "student-uuid",
  "registrationNumber": "REG001",
  "emailId": "student@example.com",
  "name": "John Student",
  "rounds": [
    {
      "roundNumber": 1,
      "name": "Initial Assessment",
      "evaluationCriteria": [
        {
          "criteriaId": "criteria-uuid-1",
          "name": "WECP Percentage",
          "description": "Online aptitude test score",
          "ratingType": "percentage",
          "isRequired": true,
          "value": 85,
          "feedback": "Good aptitude performance"
        }
      ],
      "status": "IN_PROGRESS",
      "notes": "Candidate performed well in the online assessment",
      "overallRating": 4.25,
      "evaluatedBy": {
        "employeeId": "emp123",
        "name": "Jane Smith",
        "emailId": "jane.smith@company.com"
      },
      "evaluationStartTime": "2025-04-16T10:00:00Z",
      "evaluationEndTime": null
    },
    {
      "roundNumber": 2,
      "name": "Technical Round",
      "evaluationCriteria": [...],
      "status": "NOT_STARTED",
      "notes": null,
      "overallRating": null,
      "evaluatedBy": null,
      "evaluationStartTime": null,
      "evaluationEndTime": null
    }
  ]
}
```

### Complete Round Evaluation

**Endpoint:** `PUT /students/:studentId/rounds/:roundNumber`

**Description:** Marks a round as completed.

**Request:**
```http
PUT {{baseUrl}}/students/{{studentId}}/rounds/{{roundNumber}}
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "status": "COMPLETED",
  "evaluationEndTime": "2025-04-16T10:45:00Z"
}
```

### Submit Round Evaluation (Final)

**Endpoint:** `PUT /students/:studentId/rounds/:roundNumber`

**Description:** Marks a round as submitted (final state).

**Request:**
```http
PUT {{baseUrl}}/students/{{studentId}}/rounds/{{roundNumber}}
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "status": "SUBMITTED"
}
```

## Complete API Flow Example

Here's a complete flow example showing how the APIs work together in a typical recruitment process:

### 1. Create a College

```http
POST {{baseUrl}}/colleges
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
    "name": "Harvard University",
    "city": "Cambridge"
}
```

Save the returned `collegeId` for future use.

### 2. Create a Drive with Rounds

```http
POST {{baseUrl}}/drives
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
    "name": "Summer 2025 Recruitment Drive",
    "collegeId": "{{collegeId}}",
    "collegeName": "Harvard University",
    "role": "Associate Engineer",
    "practice": "Application Development",
    "startDate": "2025-06-15T09:00:00Z",
    "primarySpocId": "{{primarySpocId}}",
    "primarySpocEmail": "primary.spoc@example.com",
    "primarySpocName": "John Doe",
    "secondarySpocs": [...],
    "isPinned": false,
    "isCompleted": false,
    "rounds": [
        {
            "roundNumber": 1,
            "name": "Initial Assessment",
            "startTime": "2025-06-15T09:00:00Z",
            "endTime": "2025-06-15T12:00:00Z",
            "evaluationCriteria": [...]
        },
        {
            "roundNumber": 2,
            "name": "Technical Round",
            "startTime": "2025-06-16T09:00:00Z",
            "endTime": "2025-06-16T17:00:00Z",
            "evaluationCriteria": [...]
        }
    ]
}
```

Save the returned `driveId` for future use.

### 3. Create a Panel

```http
POST {{baseUrl}}/panels
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
    "primaryPanelMember": {
        "employeeId": "EMP001",
        "emailId": "primary@example.com",
        "name": "John Doe"
    },
    "additionalPanelMembers": [
        {
            "employeeId": "EMP002",
            "emailId": "member1@example.com",
            "name": "Jane Smith"
        }
    ],
    "name": "Test Panel"
}
```

Save the returned `panelId` for future use.

### 4. Add Students to the Drive

#### Individual Student Creation:

```http
POST {{baseUrl}}/students
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "registrationNumber": "REG001",
  "emailId": "student@example.com",
  "name": "John Student",
  "department": "Computer Science",
  "testBatch": "Batch 1",
  "collegeId": "{{collegeId}}",
  "collegeName": "Harvard University",
  "driveId": "{{driveId}}",
  "driveName": "Summer 2025 Recruitment Drive",
  ...
}
```

Save the returned `studentId` for future use.

#### Batch Import Students:

```http
POST {{baseUrl}}/students/import/{{driveId}}
Content-Type: multipart/form-data
Authorization: Bearer {{apiKey}}

file: [Excel file with student data]
```

### 5. Create an Assignment

```http
POST {{baseUrl}}/assignments
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "studentId": "{{studentId}}",
  "studentName": "John Student",
  "registrationNumber": "REG001",
  "emailId": "student@example.com",
  "collegeId": "{{collegeId}}",
  "collegeName": "Harvard University",
  "driveId": "{{driveId}}",
  "driveName": "Summer 2025 Recruitment Drive",
  "panelId": "{{panelId}}",
  "primaryPanelMember": {
    "employeeId": "EMP001",
    "emailId": "primary@example.com",
    "name": "John Doe"
  },
  "additionalPanelMembers": [...],
  "roundNumber": 1,
  "assignedBy": {
    "employeeId": "EMP002",
    "name": "Admin User",
    "emailId": "admin@company.com"
  },
  "assignedTimestamp": "{{$isoTimestamp}}"
}
```

### 6. Evaluate Students

#### Get Student Rounds:

```http
GET {{baseUrl}}/students/{{studentId}}/rounds
Authorization: Bearer {{apiKey}}
```

#### Start Evaluation:

```http
PUT {{baseUrl}}/students/{{studentId}}/rounds/1
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "status": "IN_PROGRESS",
  "evaluatedBy": {
    "employeeId": "EMP001",
    "name": "John Doe",
    "emailId": "primary@example.com"
  },
  "evaluationStartTime": "2025-04-16T10:00:00Z"
}
```

#### Update Evaluation Criteria:

```http
PUT {{baseUrl}}/students/{{studentId}}/rounds/1
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "evaluationCriteria": [
    {
      "criteriaId": "criteria-uuid-1",
      "value": 85,
      "feedback": "Good aptitude performance"
    }
  ],
  "notes": "Candidate performed well in the online assessment"
}
```

#### Complete Evaluation:

```http
PUT {{baseUrl}}/students/{{studentId}}/rounds/1
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "status": "COMPLETED",
  "evaluationEndTime": "2025-04-16T10:45:00Z"
}
```

#### Submit Evaluation (Final):

```http
PUT {{baseUrl}}/students/{{studentId}}/rounds/1
Content-Type: application/json
Authorization: Bearer {{apiKey}}

{
  "status": "SUBMITTED"
}
```

This completes the recruitment process flow from college creation to student evaluation.
