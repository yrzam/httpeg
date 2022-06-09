# httpeg
Scalable HTTP media encoding service, or just remote ffmpeg

# API
## LIVE - for small and fast operations.
### 1. POST `/live`, Content-Type=`multipart/form-data`
### Body:
* `settings` (JSON): 
* `files` (array or a single binary) - input media