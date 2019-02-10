import * as pp from 'prettyjson';

export function prettyPrint(data) {
  console.log(pp.render(data));
}
