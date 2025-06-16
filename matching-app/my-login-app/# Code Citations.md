# Code Citations

## License: MIT
https://github.com/appsroxcom/OwnChat/blob/1195e17e852f1ce9c9802d7506bcee70eeb1d7ba/README.md

```
```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId} {
              allow read: if request.auth != null;
              allow write: if request.auth != null && request.
```


## License: MIT
https://github.com/appsroxcom/OwnChat/blob/1195e17e852f1ce9c9802d7506bcee70eeb1d7ba/README.md

```
```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId} {
              allow read: if request.auth != null;
              allow write: if request.auth != null && request.auth.uid == userId
```

