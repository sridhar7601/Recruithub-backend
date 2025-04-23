# College Module

This module provides CRUD operations for managing college entities in the RecruitHub system.

## API Endpoints

### Create College
- **URL**: `/api/colleges`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "Harvard University",
    "city": "Cambridge"
  }
  ```
- **Response**: 
  ```json
  {
    "collegeId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Harvard University",
    "city": "Cambridge",
    "isDeleted": false,
    "createdTimestamp": "2025-03-25T07:00:00.000Z",
    "updatedTimestamp": "2025-03-25T07:00:00.000Z"
  }
  ```

### Get Colleges (Paginated)
- **URL**: `/api/colleges?page=1&limit=10&city=Cambridge`
- **Method**: `GET`
- **Query Parameters**:
  - `page`: Page number (starts from 1)
  - `limit`: Number of items per page
  - `city`: (Optional) Filter by city
- **Response**:
  ```json
  {
    "items": [
      {
        "collegeId": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Harvard University",
        "city": "Cambridge",
        "isDeleted": false,
        "createdTimestamp": "2025-03-25T07:00:00.000Z",
        "updatedTimestamp": "2025-03-25T07:00:00.000Z"
      }
    ],
    "meta": {
      "totalItems": 1,
      "itemsPerPage": 10,
      "currentPage": 1,
      "totalPages": 1
    }
  }
  ```

### Get College by ID
- **URL**: `/api/colleges/{collegeId}`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "collegeId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Harvard University",
    "city": "Cambridge",
    "isDeleted": false,
    "createdTimestamp": "2025-03-25T07:00:00.000Z",
    "updatedTimestamp": "2025-03-25T07:00:00.000Z"
  }
  ```

### Update College
- **URL**: `/api/colleges/{collegeId}`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "name": "Harvard University (Updated)",
    "city": "Cambridge"
  }
  ```
- **Response**:
  ```json
  {
    "collegeId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Harvard University (Updated)",
    "city": "Cambridge",
    "isDeleted": false,
    "createdTimestamp": "2025-03-25T07:00:00.000Z",
    "updatedTimestamp": "2025-03-25T07:30:00.000Z"
  }
  ```

### Delete College (Soft Delete)
- **URL**: `/api/colleges/{collegeId}`
- **Method**: `DELETE`
- **Response**: HTTP 204 No Content

## Data Model

### College Schema
- `collegeId`: UUID (Primary Key)
- `name`: String
- `city`: String
- `isDeleted`: Boolean
- `createdTimestamp`: Timestamp
- `updatedTimestamp`: Timestamp

## Testing with Postman

A Postman collection is available at `/postman/college-api.postman_collection.json` for testing the API endpoints.

1. Import the collection into Postman
2. Create a college using the "Create College" request
3. Copy the `collegeId` from the response
4. Set the `collegeId` variable in the collection to use it in other requests
5. Test the other endpoints
