function handlePrepChange(select) {
  const coachingField = document.getElementById('coachingField');
  const coachingInput = document.getElementById('coaching');
  if (select.value === 'coaching') {
    coachingField.style.display = 'block';
    coachingInput.required = true;
  } else {
    coachingField.style.display = 'none';
    coachingInput.required = false;
    coachingInput.value = '';
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form');
  const submitBtn = document.getElementById('submitBtn'); // <-- Referencing the submit button

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Disable button and show loading text
    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';

    const name = document.getElementById('name').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const address = document.getElementById('address').value.trim();
    const rank = document.getElementById('rank').value.trim();
    const prep = document.getElementById('prep').value;
    const coaching = document.getElementById('coaching').value.trim();
    const fileInput = document.getElementById('allotment');
    const file = fileInput.files[0];

    if (!name || !whatsapp || !address || !rank || !prep || (prep === 'coaching' && !coaching) || !file) {
      alert('All fields are compulsory.');
      resetButton();
      return;
    }

    if (!/^[0-9]{10}$/.test(whatsapp)) {
      alert('Whatsapp No. should be exactly 10 digits.');
      resetButton();
      return;
    }

    const rankNum = Number(rank);
    if (isNaN(rankNum) || rankNum <= 0) {
      alert('Rank should be a positive number.');
      resetButton();
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      resetButton();
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be under 2MB.');
      resetButton();
      return;
    }

    const base64 = await toBase64(file);
    const uploadUrl = 'https://script.google.com/macros/s/AKfycbwzmFV5oZ5i8Gmir0O2o3ti2NxthSYsVf-OM1DeDp1c4hlc5jk-fdqCrL8M6oQgw5k/exec';
    const sheetdbUrl = 'https://sheetdb.io/api/v1/61t9shbdxbsuq';

    try {
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          file: base64.split(',')[1],
          filename: `${name}_allotment_${Date.now()}.pdf`,
          mimeType: file.type
        })
      });

      const uploadText = await uploadRes.text();
      console.log('Upload Response:', uploadText);

      let fileUrl = '';
      try {
        const uploadData = JSON.parse(uploadText);
        fileUrl = uploadData.link;
        if (!fileUrl) throw new Error("No file link returned");
      } catch (err) {
        console.error("Error parsing upload response:", err);
        alert("Upload succeeded but no file link was returned.");
        resetButton();
        return;
      }

      await fetch(sheetdbUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            name: name,
            whatsapp: whatsapp,
            address: address,
            rank: rank,
            coaching_self: prep === 'self' ? 'Self' : coaching,
            allotment_letter_link: fileUrl
          }]
        })
      });

      alert('Form submitted successfully!');
      form.reset();
      handlePrepChange(document.getElementById('prep'));
    } catch (err) {
      console.error('Form submission failed:', err);
      alert('There was an error submitting the form.');
    }

    // Always reset button in the end
    resetButton();
  });

  function resetButton() {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Submit';
  }
});
