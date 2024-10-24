document.getElementById("review").addEventListener("click", async function () {
    const description = document.getElementById("description").value;
    const repoUrl = document.getElementById("repo_url").value;
    const candidateLevel = document.querySelector('input[name="level"]:checked') ? document.querySelector('input[name="level"]:checked').value : null;

    let validationErrors = [];

    if (!description) {
        validationErrors.push("Assignment Description is required.");
    }

    if (!repoUrl) {
        validationErrors.push("GitHub Repo URL is required.");
    }

    if (!candidateLevel) {
        validationErrors.push("Candidate Level is required.");
    }

    if (validationErrors.length > 0) {
        document.getElementById("error_messages").innerText = validationErrors.join("\n");
        return;
    } else {
        document.getElementById("error_messages").innerText = "";  // Очищаємо повідомлення про помилки
    }

    try {
        const response = await fetch('/review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assignment_description: description,
                github_repo_url: repoUrl,
                candidate_level: candidateLevel
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail);
        }

        const data = await response.json();

        document.getElementById("file_list").innerHTML = '';
        document.getElementById("downsides").innerText = "Downsides:";
        document.getElementById("rating").innerText = "Rating:";
        document.getElementById("summary").innerText = "Summary:";

        const filesPerPage = 5;
        let currentPage = 1;
        const totalPages = Math.ceil(data.repo_files.length / filesPerPage);

        function renderPage(page) {
            document.getElementById("file_list").innerHTML = '';

            const start = (page - 1) * filesPerPage;
            const end = page * filesPerPage;

            data.repo_files.slice(start, end).forEach(file => {
                const li = document.createElement("li");
                li.textContent = file.name;
                document.getElementById("file_list").appendChild(li);
            });

            document.getElementById("pagination").innerHTML = '';
            if (page > 1) {
                const prevButton = document.createElement("button");
                prevButton.textContent = "Previous";
                prevButton.addEventListener("click", function () {
                    renderPage(page - 1);
                });
                document.getElementById("pagination").appendChild(prevButton);
            }

            if (page < totalPages) {
                const nextButton = document.createElement("button");
                nextButton.textContent = "Next";
                nextButton.addEventListener("click", function () {
                    renderPage(page + 1);
                });
                document.getElementById("pagination").appendChild(nextButton);
            }
        }

        renderPage(currentPage);

        document.getElementById("downsides").innerText = "Downsides:\n" + data.review_result.downsides.join("\n");
        document.getElementById("rating").innerText = "Rating: " + data.review_result.rating;
        document.getElementById("summary").innerText = data.review_result.summary;

    } catch (error) {
        document.getElementById("error_messages").innerText = `Error: ${error.message}`;
    }
});

document.getElementById("clear").addEventListener("click", function () {
    document.getElementById("description").value = "";
    document.getElementById("repo_url").value = "";

    const radioButtons = document.querySelectorAll('input[name="level"]');
    radioButtons.forEach((radio) => {
        radio.checked = false;
    });

    document.getElementById("file_list").innerHTML = "";
    document.getElementById("downsides").innerText = "Downsides:";
    document.getElementById("rating").innerText = "Rating:";
    document.getElementById("summary").innerText = "";

    document.getElementById("error_messages").innerText = "";

    document.getElementById("pagination").innerHTML = "";
});
