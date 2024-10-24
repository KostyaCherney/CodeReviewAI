# CodeReviewAI
CodeReviewAI
###### Works fine with:

    - internet connection required
    - git:latest
    - docker: Docker latest
    - docker-compose latest

### INSTALATION

1. Clone repository:

```
git clone <repo url>
cd CodeReviewAI
```

2. Add .env file
```
OPENAI_API_KEY=your_key
GITHUB_TOKEN=your_key
```
4. Run repository

cd <path/to/local/repo>
```
docker-compose up --build
```

4. Open
```
   http://0.0.0.0:8000/
```
Part 2

This was an interesting task for me, I included Redis because I had not worked with it before and it would require additional time to learn. 
To scale the system, I would use containerization (Docker) with orchestration through Kubernetes to automatically scale with growing loads.
Requests would be processed asynchronously via message queues (RabbitMQ or Kafka) to avoid overloading the system. 
The GitHub API would use pagination to efficiently handle large repositories, and OpenAI would use asynchronous calls and rate-limiting 
to optimize API usage and manage costs. This would ensure the stability and scalability of the system under high loads.
