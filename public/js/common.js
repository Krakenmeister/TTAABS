function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function verifyName(name) {
  if (name.length > 13) {
    alert("Please pick a shorter name.");
    return false;
  }
  for (let i = 0; i < name.length; i++) {
    let ascii = name.charCodeAt(i);
    if (
      !(ascii > 47 && ascii < 58) &&
      !(ascii > 64 && ascii < 91) &&
      !(ascii > 96 && ascii < 123)
    ) {
      alert("Please use valid characters in name.");
      return false;
    }
  }
  return true;
}

function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) == 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}
