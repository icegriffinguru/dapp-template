import * as React from 'react';
import {
  contractAddress
} from 'config';

import {
  transactionServices,
  useGetAccountInfo,
  useGetPendingTransactions,
  refreshAccount,
  useGetNetworkConfig,
  DappUI,
  getAccountProvider
} from '@elrondnetwork/dapp-core';
import {
  Address,
  AddressValue,
  Nonce,
  ContractFunction,
  ProxyProvider,
  WalletProvider,
  Query,
  SmartContract,
  Egld,
  GasLimit,
  BigUIntValue,
  Balance,
  BytesValue,
  ArgSerializer,
  TransactionPayload,
  AbiRegistry,
  SmartContractAbi,
  Interaction,
  QueryResponseBundle,
  ReturnCode,
  TypedValue,
  U64Value
} from '@elrondnetwork/erdjs';
import BigNumber from '@elrondnetwork/erdjs/node_modules/bignumber.js/bignumber.js';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';


const Actions = () => {
  const account = useGetAccountInfo();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const { network } = useGetNetworkConfig();
  const { address } = account;
  const proxy = new ProxyProvider(network.apiAddress);

  const [secondsLeft, setSecondsLeft] = React.useState<number>();
  const [hasPing, setHasPing] = React.useState<boolean>();
  const /*transactionSessionId*/ [, setTransactionSessionId] = React.useState<
      string | null
    >(null);

    const [tokenId, setTokenId] = React.useState<string | undefined>();
    const [tokenPrice, setTokenPrice] = React.useState<number | undefined>();
    const [buyLimit, setBuyLimit] = React.useState<number>();
    const [startTime, setStartTime] = React.useState<number>();
    const [endTime, setEndTime] = React.useState<number>();
    const Millis = 1000;
  
    const [contract, setContract] = React.useState<SmartContract>();
  
    React.useEffect(() => {
      
    }, []); // [] makes useEffect run once
  
    const sendQuery = async (interaction: Interaction) => {
      if (!contract) return;
      const queryResponse = await contract.runQuery(proxy, interaction.buildQuery());
      const res = interaction.interpretQueryResponse(queryResponse);
      return res;
    };
  
    React.useEffect(() => {
      if (!contract) return;
      (async () => {
        const interaction: Interaction = contract.methods.getTokenId();
        const res: QueryResponseBundle | undefined = await sendQuery(interaction);
        if (!res || !res.returnCode.isSuccess()) return;
        const value = res.firstValue.valueOf().toString();
        setTokenId(value);
      })();
    }, [contract]);
  
    React.useEffect(() => {
      if (!contract) return;
      (async () => {
        const interaction: Interaction = contract.methods.getTokenPrice();
        const res: QueryResponseBundle | undefined = await sendQuery(interaction);
        if (!res || !res.returnCode.isSuccess()) return;
        const value = parseFloat(Egld.raw(res.firstValue.valueOf()).toDenominated());
        setTokenPrice(value);
      })();
    }, [contract]);
  
    React.useEffect(() => {
      if (!contract) return;
      (async () => {
        const interaction: Interaction = contract.methods.getBuyLimit();
        const res: QueryResponseBundle | undefined = await sendQuery(interaction);
        if (!res || !res.returnCode.isSuccess()) return;
        const value = parseFloat(Egld.raw(res.firstValue.valueOf()).toDenominated());
        setBuyLimit(value);
      })();
    }, [contract]);
  
    React.useEffect(() => {
      if (!contract) return;
      (async () => {
        const interaction: Interaction = contract.methods.getStartTime();
        const res: QueryResponseBundle | undefined = await sendQuery(interaction);
        if (!res || !res.returnCode.isSuccess()) return;
        const value = parseInt(res.firstValue.valueOf());
        setStartTime(value);
      })();
    }, [contract]);
    
    React.useEffect(() => {
      if (!contract) return;
      (async () => {
        const interaction: Interaction = contract.methods.getEndTime();
        const res: QueryResponseBundle | undefined = await sendQuery(interaction);
        if (!res || !res.returnCode.isSuccess()) return;
        const value = parseInt(res.firstValue.valueOf());
        setEndTime(value);
      })();
    }, [contract]);
  
    const sendTransaction = async (functionName: string, args: any[]) => {
      if (!contract) return;
      const tx = contract.call({
        func: new ContractFunction(functionName),
        gasLimit: new GasLimit(5000000),
        args: args
      });
  
      await refreshAccount();
  
      const { sessionId /*, error*/ } = await sendTransactions({
        transactions: tx,
        transactionsDisplayInfo: {
          processingMessage: 'Processing ' + functionName + ' transaction',
          errorMessage: 'An error has occured during ' + functionName,
          successMessage: functionName + ' transaction successful'
        },
        redirectAfterSign: false
      });
    };
  
    const updateTokenId = (e: any) => {
      e.preventDefault();
      if (!tokenId){
        alert('Token Id cannot be null.');
        return;
      }
      const args = [BytesValue.fromUTF8(tokenId)];
      sendTransaction('updateTokenId', args);
    };
  
    const updateTokenPrice = (e: any) => {
      e.preventDefault();
      console.log('tokenPrice', tokenPrice);
      if (!tokenPrice){
        alert('Token Price cannot be null.');
        return;
      }
      const args = [new BigUIntValue(Balance.egld(tokenPrice).valueOf())];
      sendTransaction('updateTokenPrice', args);
    };
  
    const updateBuyLimit = (e: any) => {
      e.preventDefault();
      if (!buyLimit){
        alert('Buy Limit cannot be null.');
        return;
      }
      const args = [new BigUIntValue(Balance.egld(buyLimit).valueOf())];
      sendTransaction('updateBuyLimit', args);
    };
  
    const updateTimes = (e: any) => {
      e.preventDefault();
      if (!startTime || !endTime){
        alert('Start Time and End Time should be set.');
        return;
      }
      if (startTime <= (new Date()).getTime() / Millis){
        alert('Start Time cannot be past.');
        return;
      }
      if (startTime >= endTime){
        alert('Start Time cannot be before than End Time.');
        return;
      }
      const args = [new U64Value(new BigNumber(startTime)), new U64Value(new BigNumber(endTime))];
      sendTransaction('updateTimes', args);
    };

  const mount = () => {
    if (secondsLeft) {
      const interval = setInterval(() => {
        setSecondsLeft((existing) => {
          if (existing) {
            return existing - 1;
          } else {
            clearInterval(interval);
            return 0;
          }
        });
      }, 1000);
      return () => {
        clearInterval(interval);
      };
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(mount, [hasPing]);

  React.useEffect(() => {
    const query = new Query({
      address: new Address(contractAddress),
      func: new ContractFunction('getTimeToPong'),
      args: [new AddressValue(new Address(address))]
    });
    const proxy = new ProxyProvider(network.apiAddress);
    proxy
      .queryContract(query)
      .then(({ returnData }) => {
        const [encoded] = returnData;
        switch (encoded) {
          case undefined:
            setHasPing(true);
            break;
          case '':
            setSecondsLeft(0);
            setHasPing(false);
            break;
          default: {
            const decoded = Buffer.from(encoded, 'base64').toString('hex');
            setSecondsLeft(parseInt(decoded, 16));
            setHasPing(false);
            break;
          }
        }
      })
      .catch((err) => {
        console.error('Unable to call VM query', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingTransactions]);

  const { sendTransactions } = transactionServices;

  const sendPingTransaction = async () => {
    const pingTransaction = {
      value: '1000000000000000000',
      data: 'ping',
      receiver: contractAddress
    };
    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: pingTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing Ping transaction',
        errorMessage: 'An error has occured during Ping',
        successMessage: 'Ping transaction successful'
      },
      redirectAfterSign: false
    });
    if (sessionId != null) {
      setTransactionSessionId(sessionId);
    }
  };

  const sendPongTransaction = async () => {
    const pongTransaction = {
      value: '0',
      data: 'pong',
      receiver: contractAddress
    };
    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: pongTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing Pong transaction',
        errorMessage: 'An error has occured during Pong',
        successMessage: 'Pong transaction successful'
      },
      redirectAfterSign: false
    });
    if (sessionId != null) {
      setTransactionSessionId(sessionId);
    }
  };

  const pongAllowed = secondsLeft === 0 && !hasPendingTransactions;
  const notAllowedClass = pongAllowed ? '' : 'not-allowed disabled';

  const timeRemaining = moment()
    .startOf('day')
    .seconds(secondsLeft || 0)
    .format('mm:ss');

  return (
    <div className='d-flex mt-4 justify-content-center'>
      {hasPing !== undefined && (
        <>
          {hasPing && !hasPendingTransactions ? (
            <div className='action-btn' onClick={sendPingTransaction}>
              <button className='btn'>
                <FontAwesomeIcon icon={faArrowUp} className='text-primary' />
              </button>
              <a href='/' className='text-white text-decoration-none'>
                Ping
              </a>
            </div>
          ) : (
            <>
              <div className='d-flex flex-column'>
                <div
                  {...{
                    className: `action-btn ${notAllowedClass}`,
                    ...(pongAllowed ? { onClick: sendPongTransaction } : {})
                  }}
                >
                  <button className={`btn ${notAllowedClass}`}>
                    <FontAwesomeIcon
                      icon={faArrowDown}
                      className='text-primary'
                    />
                  </button>
                  <span className='text-white'>
                    {pongAllowed ? (
                      <a href='/' className='text-white text-decoration-none'>
                        Pong
                      </a>
                    ) : (
                      <>Pong</>
                    )}
                  </span>
                </div>
                {!pongAllowed && !hasPendingTransactions && (
                  <span className='opacity-6 text-white'>
                    {timeRemaining} until able to Pong
                  </span>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Actions;
