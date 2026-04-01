

async function testApi() {
  try {
    const res = await fetch('http://localhost:3000/api/form-schema?name=patient-admission', { cache: 'no-store' });
    const data = await res.json();
    console.log('--- Initial Data ---');
    console.log('ID:', data.id);
    console.log('Steps:', data.steps.length);
    console.log('Fields:', data.fields.length);

    console.log('--- Deleting Last Field ---');
    const newFields = data.fields.slice(0, data.fields.length - 1);
    console.log('New Fields count:', newFields.length);

    const putRes = await fetch('http://localhost:3000/api/form-schema', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: data.id,
        schema_name: data.schema_name,
        steps: data.steps,
        fields: newFields
      })
    });
    
    console.log('PUT Status:', putRes.status);
    console.log('PUT Body:', await putRes.json());

    console.log('--- Fetching again ---');
    const res2 = await fetch('http://localhost:3000/api/form-schema?name=patient-admission', { cache: 'no-store' });
    const data2 = await res2.json();
    console.log('Final Fields:', data2.fields.length);

  } catch (err) {
    console.error(err);
  }
}

testApi();
