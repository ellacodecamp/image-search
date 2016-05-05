# Image Search Abstraction Layer Microservice.

This repository implements Image Search Abstraction Layer microservice for one of FCC backend projects.

The service can be found running on [Heroku](https://image-search-ellacodecamp.herokuapp.com)

## User Stories

* I can get the image URLs, alt text and page urls for a set of images relating to a given search string.
* I can paginate through the responses by adding a ```?offset=2``` parameter to the URL.
* I can get a list of the most recently submitted search strings.

## Running on Heroku

To run this app on Heroku, configure MongoDB add-on and the following environment variables:

* ```MONGO_URI```
* ```APP_CX``` - context of the custom search query configured on Google website
* ```APP_KEY``` - application key created on Google website

## Design notes

This microservice is a wrapper around image search HTTPS request to Google. This is how this request looks like:

```
https://www.googleapis.com//customsearch/v1?key=<APP_KEY>&cx=<APP_CX>&q=<query>&searchType=image&fileType=jpg&imgSize=large&alt=json&num=10&start=<1 + offset>"
```

This query executed when the following URL is called:

```
https://image-search-ellacodecamp.herokuapp.com/api/imagesearch/<query>?offset=<number>
```

In this request ```offset``` is optional and is assumed to be 0 if not specified. The timestamp of the request and the query are stored in the database with
the timestamp used in ```_id``` field.
We use timestamp ISO format as a key. For this toy implementation of this microservice the key collisions are unlikely since the time is resolved to the order
of microseconds and we have only a single server process running servicing the requests. If this service were to be deployed as real life production service
able to handle significant traffic, the collisions would become more likely and a redesign will be necessary for the way that this information is stored.

To get the list of the most recently submitted search strings the following URL is called:

```
https://image-search-ellacodecamp.herokuapp.com/api/latest/imagesearch/
```