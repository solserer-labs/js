import { fetch } from '../../isomorphic';
import { ConversionRateProvider, Currency } from './ConversionRateProvider';

export class Coingecko implements ConversionRateProvider {
  constructor() {}

  // this method translates currency strings to the format that coingecko requires
  private static translateCurrency(currency: Currency): string {
    switch (currency) {
      case Currency.AR:
        return 'arweave';
      case Currency.SOL:
        return 'solana';
      case Currency.USD:
        return 'usd';
      case Currency.EUR:
        return 'eur';
      default:
        throw new Error('Invalid currency supplied to Coingecko conversion rate provider');
    }
  }

  async getRate(from: Currency | Currency[], to: Currency | Currency[]) {
    const fromArray = typeof from === 'string' ? [from] : from;
    const toArray = typeof to === 'string' ? [to] : to;
    const fromIds = fromArray.map((currency) => Coingecko.translateCurrency(currency)).join(',');
    const toIds = toArray.map((currency) => Coingecko.translateCurrency(currency)).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${fromIds}&vs_currencies=${toIds}`;
    const response = await fetch(url);
    const json = await response.json();
    return fromArray.reduce((previousPairs, fromCurrency) => {
      return [
        ...previousPairs,
        ...toArray.map((toCurrency) => ({
          from: fromCurrency,
          to: toCurrency,
          rate: json[Coingecko.translateCurrency(fromCurrency)][
            Coingecko.translateCurrency(toCurrency)
          ],
        })),
      ];
    }, []);
  }
}
