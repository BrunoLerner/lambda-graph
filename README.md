# lambda-graph
Microservice that will run in lambda. 
It receives a JSON with information about the changes of a property over time. 
It creates a multiline graph, and then creates a PNG of that graph, and send it to S3 so it can embed on a Slack notification 
