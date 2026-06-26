const argon2 = require('argon2');

async function main() {
  const hash = '$argon2id$v=19$m=65536,t=3,p=4$7usedkExywdZw4o2wXByTQ$xR8jsZP4M3KS6zcTMg6bxKD5ujaLdEbORd+4BMjJEko';
  const passwords = ['Student@123', 'TempPass@123', 'Welcome@123', 'password', 'admin', '123456', 'Kiranteja@123'];
  for (const p of passwords) {
    if (await argon2.verify(hash, p)) {
      console.log('Match found: ' + p);
      return;
    }
  }
  console.log('No match found among defaults.');
}
main();
