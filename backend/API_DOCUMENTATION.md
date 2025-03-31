# Exercise App API Documentation

This API allows clients to register users, authenticate, create and manage exercises, as well as perform operations like favoriting, saving, and rating exercises. Some endpoints require an access token obtained via login and token refresh.

> **Note:**  
> - All endpoints (except those explicitly marked as public) require a valid JWT access token in the `Authorization` header in the format:  
>   ```
>   Authorization: Bearer <access_token>
>   ```
> - JWT access tokens expire in 15 minutes. A refresh token is provided upon login to obtain a new access token.

---

## Base URL

http://<your-server-host>:3000


---

## Endpoints

### 1. User Authentication

#### Register User

- **URL:** `/users/register`  
- **Method:** `POST`  
- **Authentication:** Public  
- **Request Body:**

  ```json
  {
    "username": "string",
    "password": "string"
  }

Success Response:

Code: 201 Created

Content:

{
  "message": "User created",
  "userId": 1
}

Error Responses:

Code: 400 Bad Request

json
Copy
{
  "message": "Error creating user",
  "error": "Error details..."
}
Login User
URL: /users/login

Method: POST

Authentication: Public

Request Body:

json
Copy
{
  "username": "string",
  "password": "string"
}
Success Response:

Code: 200 OK

Content:

json
Copy
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
Error Responses:

Code: 400 Bad Request (e.g., Invalid credentials)

Code: 500 Internal Server Error

Refresh Token
URL: /users/refresh-token

Method: POST

Authentication: Public

Request Body:

json
Copy
{
  "refreshToken": "jwt-refresh-token"
}
Success Response:

Code: 200 OK

Content:

json
Copy
{
  "accessToken": "new-jwt-access-token"
}
Error Responses:

Code: 400 Bad Request (Missing refresh token)

Code: 403 Forbidden (Invalid or expired refresh token)

2. Exercise Management
Note: All endpoints below require a valid access token.

Create Exercise
URL: /exercises

Method: POST

Authentication: Required

Request Body:

json
Copy
{
  "name": "Push Up",
  "description": "Upper body workout",
  "difficulty": 3,
  "isPublic": true
}
Success Response:

Code: 201 Created

Content:

json
Copy
{
  "message": "Exercise created",
  "exercise": {
    "id": 1,
    "name": "Push Up",
    "description": "Upper body workout",
    "difficulty": 3,
    "isPublic": true,
    "userId": 1
  }
}
Error Responses:

Code: 400 Bad Request (e.g., Validation error)

Update Exercise
URL: /exercises/:id

Method: PUT

Authentication: Required

URL Parameter:

id: The ID of the exercise to update.

Request Body: (Example)

json
Copy
{
  "description": "Updated description"
}
Success Response:

Code: 200 OK

Content:

json
Copy
{
  "message": "Exercise updated",
  "exercise": {
    "id": 1,
    "name": "Push Up",
    "description": "Updated description",
    "difficulty": 3,
    "isPublic": true,
    "userId": 1
  }
}
Error Responses:

Code: 404 Not Found (Exercise not found)

Code: 403 Forbidden (User not allowed to update)

Code: 400 Bad Request (Error updating exercise)

Delete Exercise
URL: /exercises/:id

Method: DELETE

Authentication: Required

URL Parameter:

id: The ID of the exercise to delete.

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "message": "Exercise deleted"
}
Error Responses:

Code: 404 Not Found (Exercise not found)

Code: 403 Forbidden (User not allowed to delete)

Code: 400 Bad Request (Error deleting exercise)

Get List of Exercises
URL: /exercises

Method: GET

Authentication: Required

Query Parameters (Optional):

sortBy: Field name to sort by (e.g., "name").

search: Search term to filter exercises (matches name, description, or difficulty).

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "exercises": [
    {
      "id": 1,
      "name": "Push Up",
      "description": "Upper body workout",
      "difficulty": 3,
      "isPublic": true,
      "favoriteCount": 2,
      "saveCount": 1
    }
  ]
}
Error Responses:

Code: 400 Bad Request (Error fetching exercises)

Get Specific Exercise
URL: /exercises/:id

Method: GET

Authentication: Required

URL Parameter:

id: The ID of the exercise.

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "id": 1,
  "name": "Push Up",
  "description": "Upper body workout",
  "difficulty": 3,
  "averageRating": "4.5",
  "favoriteCount": 2,
  "saveCount": 1
}
Error Responses:

Code: 404 Not Found (Exercise not found)

Code: 403 Forbidden (User not allowed to view)

Code: 400 Bad Request (Error fetching exercise)

3. Exercise Interactions
Note: These endpoints require authentication.

Favorite an Exercise
URL: /exercises/:id/favorite

Method: POST

URL Parameter:

id: The ID of the exercise.

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "message": "Exercise favorited"
}
Error Responses:

Code: 404 Not Found (Exercise not found)

Code: 400 Bad Request (Error favoriting exercise)

Remove Favorite
URL: /exercises/:id/favorite

Method: DELETE

URL Parameter:

id: The ID of the exercise.

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "message": "Favorite removed" // or "No favorite found"
}
Error Responses:

Code: 400 Bad Request (Error removing favorite)

Save an Exercise
URL: /exercises/:id/save

Method: POST

URL Parameter:

id: The ID of the exercise.

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "message": "Exercise saved"
}
Error Responses:

Code: 404 Not Found (Exercise not found)

Code: 400 Bad Request (Error saving exercise)

Remove Save
URL: /exercises/:id/save

Method: DELETE

URL Parameter:

id: The ID of the exercise.

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "message": "Save removed" // or "No save found"
}
Error Responses:

Code: 400 Bad Request (Error removing save)

Rate an Exercise
URL: /exercises/:id/rate

Method: POST

Authentication: Required

URL Parameter:

id: The ID of the exercise.

Request Body:

json
Copy
{
  "score": 4
}
Note: Score must be between 1 and 5.

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "message": "Exercise rated",
  "rating": {
    "userId": 1,
    "exerciseId": 1,
    "score": 4
  }
}
Error Responses:

Code: 400 Bad Request (Invalid score or error rating exercise)

Get User Collections (Favorites & Saves)
URL: /users/collections

Method: GET

Authentication: Required

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "collections": [
    {
      "exercise": { /* exercise object */ },
      "isFavorited": true,
      "isSaved": false
    }
  ]
}
Error Responses:

Code: 400 Bad Request (Error fetching collections)

Get Users Who Favorited an Exercise
URL: /exercises/:id/favorites

Method: GET

Authentication: Required

URL Parameter:

id: The ID of the exercise.

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "users": [
    {
      "id": 1,
      "username": "testuser"
    }
  ]
}
Error Responses:

Code: 404 Not Found (Exercise not found)

Code: 400 Bad Request (Error fetching favorites)

Get Users Who Saved an Exercise
URL: /exercises/:id/saves

Method: GET

Authentication: Required

URL Parameter:

id: The ID of the exercise.

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "users": [
    {
      "id": 1,
      "username": "testuser"
    }
  ]
}
Error Responses:

Code: 404 Not Found (Exercise not found)

Code: 400 Bad Request (Error fetching saves)

4. Public Endpoints
Get Public Exercises
URL: /public-exercises

Method: GET

Authentication: Not required

Query Parameters (Optional):

sortBy: Field name to sort by.

search: Search term to filter exercises (matches name, description, or difficulty).

Success Response:

Code: 200 OK

Content:

json
Copy
{
  "exercises": [
    {
      "id": 1,
      "name": "Push Up",
      "description": "Upper body workout",
      "difficulty": 3,
      "isPublic": true,
      "favoriteCount": 2,
      "saveCount": 1
    }
  ]
}
Error Responses:

Code: 400 Bad Request (Error fetching public exercises)

Error Handling
401 Unauthorized: Missing or invalid Authorization header.

403 Forbidden: Invalid/expired token or insufficient permissions (e.g., modifying someone else's exercise).

404 Not Found: Requested resource not found.

400 Bad Request: Validation errors or malformed requests.

500 Internal Server Error: Unexpected server errors.

Authentication Details
JWT Secret: your_jwt_secret (Keep this secret in production.)

Access Token Expiration: 15 minutes

Refresh Token Expiration: 7 days

Database & Associations
Database: SQLite (./database.sqlite)

Models:

User: Contains username and hashed password.

Exercise: Contains name, description, difficulty (1-5), and isPublic flag.

Favorite, Save, Rating: Join and related models for user interactions.

Associations:

A User can create many Exercises.

A User can favorite, save, and rate many Exercises.

Exercises keep track of the number of favorites and saves.

Average rating is calculated based on all associated ratings.

Additional Notes
Server Initialization:
The server syncs the database with foreign keys temporarily disabled during the sync process, then re-enabled.

Usage:
Use the provided endpoints to integrate the exercise functionality into your frontend or third-party applications.