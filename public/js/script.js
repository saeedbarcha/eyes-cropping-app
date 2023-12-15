async function uploadImage() {
    const imageInput = document.getElementById('imageInput');
    const uploadedImage = document.getElementById('uploadedImage');
    const cropButton = document.getElementById('cropButton');

    if (imageInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);

        const response = await fetch('/uploads', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.status === 'success') {
            uploadedImage.src = result.path;
            uploadedImage.style.display = 'block';
            cropButton.style.display = 'block';
        }
    }
}

// async function cropEyes() {
//     const croppedImage = document.getElementById('uploadedImage'); // Using same img tag for simplicity.
//     const downloadLink = document.getElementById('downloadLink');

//     const response = await fetch('/crop');
//     const result = await response.json();

//     if (result.status === 'success') {
//         croppedImage.src = result.path;
//         downloadLink.href = result.path;
//         downloadLink.style.display = 'block';
//     }
// }

// async function cropEyes() {
//     console.log("hhhhhhhhhhhhhh")
//     const croppedImage = document.getElementById('uploadedImage');
//     const downloadLink = document.getElementById('downloadLink');

//     // Extract the image name from the src attribute
//     const imageName = croppedImage.src.split('/').pop();

//     // Use the extracted image name to call the modified endpoint
//     const response = await fetch(`/crop/${imageName}`);
//     const result = await response.json();

//     if (result.status === 'success') {
//         croppedImage.src = result.path;
//         downloadLink.href = result.path;
//         downloadLink.style.display = 'block';
//     }
// }

async function cropEyes() {
    const croppedImage = document.getElementById('uploadedImage');
    const downloadLink = document.getElementById('downloadLink');

    const imageName = croppedImage.src.split('/').pop();

    try {
        const response = await fetch(`/crop/${imageName}`);

        // Check if the response is okay
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();

        if (result.status === 'success') {
            croppedImage.src = result.path;
            downloadLink.href = result.path;
            downloadLink.style.display = 'block';
        }
    } catch (error) {
        console.log('There was a problem with the fetch operation:', error.message);
    }
}

