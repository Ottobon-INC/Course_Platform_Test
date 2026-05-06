import fetch from 'node-fetch';
async function main() {
  try {
    const res = await fetch('http://localhost:5000/api/registrations/offerings?programType=cohort');
    const data: any = await res.json();
    const s18 = data.offerings.find((o: any) => o.title === 'sample 18');
    console.log('S18 Offering from API:', JSON.stringify(s18, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
