import 'isomorphic-fetch';
import { flatten, memoize } from 'lodash';
import { escapeQuotes } from './escape_kuery';
import { kfetch } from '../../kfetch';

const type = 'value';

const requestSuggestions = memoize((query, field) => {
  return kfetch({
    pathname: `/api/kibana/suggestions/values/${field.indexPatternTitle}`,
    method: 'POST',
    body: JSON.stringify({ query, field: field.name }),
  });
}, resolver);

export function getSuggestionsProvider({ config, indexPatterns }) {
  const allFields = flatten(
    indexPatterns.map(indexPattern => {
      return indexPattern.fields.map(field => ({
        ...field,
        indexPatternTitle: indexPattern.title,
      }));
    })
  );
  const shouldSuggestValues = config.get('filterEditor:suggestValues');

  return function getValueSuggestions({
    start,
    end,
    prefix,
    suffix,
    fieldName,
  }) {
    const fields = allFields.filter(field => field.name === fieldName);
    const query = `${prefix}${suffix}`;

    const suggestionsByField = fields.map(field => {
      if (field.type === 'boolean') {
        return wrapAsSuggestions(start, end, query, ['true', 'false']);
      } else if (
        !shouldSuggestValues ||
        !field.aggregatable ||
        field.type !== 'string'
      ) {
        return [];
      }

      return requestSuggestions(query, field).then(data => {
        const quotedValues = data.map(value => `"${escapeQuotes(value)}"`);
        return wrapAsSuggestions(start, end, query, quotedValues);
      });
    });

    return Promise.all(suggestionsByField).then(suggestions =>
      flatten(suggestions)
    );
  };
}

function wrapAsSuggestions(start, end, query, values) {
  return values
    .filter(value => value.toLowerCase().includes(query.toLowerCase()))
    .map(value => {
      const text = `${value} `;
      return { type, text, start, end };
    });
}

function resolver(query, field) {
  // Only cache results for a minute
  const ttl = Math.floor(Date.now() / 1000 / 60);
  return [ttl, query, field.indexPatternTitle, field.name].join('|');
}
