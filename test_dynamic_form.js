async function testAdmission() {
  const payload = {
    LastName: "Tester",
    GivenName: "DynamicForm",
    MiddleName: "No",
    Suffix: "",
    Birthday: "1990-01-01",
    Age: 36,
    Sex: "Male",
    ContactNumber: "09123456789",
    CityAddress: "Cebu City",
    ProvincialAddress: "Cebu",
    CivilStatus: "Single",
    Religion: "Catholic",
    Citizenship: "Filipino",
    Occupation: "Tester",
    AttendingPhysician: "Dr. Smith",
    PreviouslyAdmitted: false,
    PhilHealthStatus: "Member",
    HmoCompany: false,
    VmcBenefit: "None",
    ServiceCaseType: "Private"
  };

  try {
    const response = await fetch('http://localhost:3000/api/admit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data.success && data.controlNumber) {
      console.log(`PASS: Control Number generated: ${data.controlNumber}`);
      if (/^\d{8}-\d+$/.test(data.controlNumber)) {
        console.log('PASS: Format is correct (YYYYMMDD-N)');
      } else {
        console.log('FAIL: Format is incorrect');
      }
    } else {
      console.log('FAIL: Control Number not found in response');
    }
  } catch (err) {
    console.error('Test failed:', err.message);
    console.log('Note: Ensure the local dev server is running at http://localhost:3000');
  }
}

testAdmission();
