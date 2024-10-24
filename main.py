import openai
import httpx
import logging
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from openai import api_key
from pydantic import BaseModel, HttpUrl, validator
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os

load_dotenv()

logging.basicConfig(level=logging.INFO)

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def serve_index():
    return FileResponse("static/index.html")


openai.api_key = os.getenv("OPENAI_API_KEY")
your_github_token = os.getenv("GITHUB_TOKEN")


class ReviewRequest(BaseModel):
    assignment_description: str
    github_repo_url: HttpUrl
    # api_key: str
    candidate_level: str

    @validator('candidate_level')
    def validate_candidate_level(cls, value):
        value = value.lower()
        allowed_values = ['junior', 'middle', 'senior']
        if value not in allowed_values:
            raise ValueError('Candidate level must be one of: Junior, Middle, Senior')
        return value


async def get_repo_files_async(repo_url: str):
    try:
        repo_name = str(repo_url).split("github.com/")[-1]
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"token {your_github_token}"}
            response = await client.get(f"https://api.github.com/repos/{repo_name}/contents", headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logging.error(f"GitHub API Error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail=f"GitHub API Error: {e}")


async def analyze_code(assignment_description: str):
    messages = [
        {"role": "system", "content": "You are a highly skilled code reviewer."},
        {"role": "user", "content": f"Analyze the following code assignment:\n\n{assignment_description}"}
    ]
    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=10,
            temperature=0
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        logging.error(f"OpenAI API Error: {e}")
        raise HTTPException(status_code=409, detail=f"OpenAI API Error: {e}")


@app.post("/review")
async def review_code(request: ReviewRequest):
    try:
        repo_files = await get_all_files(request.github_repo_url)

        analysis = await analyze_code(request.assignment_description)

        return {
            "repo_files": repo_files,
            "review_result": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_all_files(repo_url: str):
    files = []
    repo_name = str(repo_url).split("github.com/")[-1]
    url = f"https://api.github.com/repos/{repo_name}/contents"

    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"token {your_github_token}"}
        while url:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            page_files = response.json()
            # files.extend(page_files)
            for file_info in page_files:
                files.append({"name": file_info["name"]})

            if "Link" in response.headers:
                links = response.headers["Link"]
                next_url = None
                for link in links.split(","):
                    if 'rel="next"' in link:
                        next_url = link[link.find("<") + 1:link.find(">")]
                        break
                url = next_url
            else:
                url = None
    return files
