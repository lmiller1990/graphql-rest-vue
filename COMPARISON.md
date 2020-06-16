## Rest

- divides resources by "type"
- several requests are often needed
- (more) simple to implement
- mostly static
  - flexibility via query params, etc.

## GraphQL

- a single request
- many resources can be fetched in a single request, result is not pre-defined
- (more) complex to implement. N+1 problem is common.
- highly flexible
