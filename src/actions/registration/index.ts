import { AnyAction, Dispatch } from 'redux'
import { navigationActions, genericActions } from 'src/actions/'
import { BackendMiddleware } from 'src/backendMiddleware'
import { routeList } from 'src/routeList'
import * as loading from 'src/actions/registration/loadingStages'
import { setDid } from 'src/actions/account'

export const setLoadingMsg = (loadingMsg: string) => {
  return {
    type: 'SET_LOADING_MSG',
    value: loadingMsg
  }
}

export const savePassword = (password : string) => {
  return async (dispatch : Dispatch<AnyAction>, getState: Function, backendMiddleware : BackendMiddleware) =>  {
    try {
      await backendMiddleware.keyChainLib.savePassword(password)
      dispatch(navigationActions.navigatorReset({ routeName: routeList.Entropy }))
    } catch (err) {
      dispatch(genericActions.showErrorScreen(err))
    }
  }
}

export const submitEntropy = (encodedEntropy: string) => {
  return (dispatch : Dispatch<AnyAction>) => {
    dispatch(navigationActions.navigatorReset({
      routeName: routeList.Loading
    }))

    dispatch(setLoadingMsg(loading.loadingStages[0]))

    setTimeout(() => {
      dispatch(createIdentity(encodedEntropy))
    }, 2000)
  } 
}

export const startRegistration = () => {
  return (dispatch: Dispatch<AnyAction>) => {
    dispatch(navigationActions.navigatorReset({
      routeName: routeList.PasswordEntry
    }))
  }
}

export const finishRegistration = () => {
  return (dispatch: Dispatch<AnyAction>) => {
    dispatch(navigationActions.navigatorReset( 
      {routeName: routeList.Home }
    ))
  }
}

export const createIdentity = (encodedEntropy: string) => {
  return async (dispatch : Dispatch<AnyAction>, getState: Function, backendMiddleware : BackendMiddleware) => {
    const { jolocomLib, ethereumLib, storageLib, encryptionLib, keyChainLib } = backendMiddleware

    try {
      const {
        didDocument,
        mnemonic,
        genericSigningKey,
        ethereumKey
      } = await jolocomLib.identity.create(encodedEntropy)


      const password = await keyChainLib.getPassword()
      const encEntropy = encryptionLib.encryptWithPass({ data: encodedEntropy, pass: password })
      const encEthWif = encryptionLib.encryptWithPass({ data: ethereumKey.wif, pass: password })
      const encGenWif = encryptionLib.encryptWithPass({ data: genericSigningKey.wif, pass: password })

      const masterKeyData = {
        encryptedEntropy: encEntropy,
        timestamp: Date.now()
      }

      const genericSigningKeyData = {
        encryptedWif: encGenWif,
        path: genericSigningKey.path,
        keyType: genericSigningKey.keyType,
        entropySource: masterKeyData
      }

      const ethereumKeyData = {
        encryptedWif: encEthWif,
        path: ethereumKey.path,
        keyType: ethereumKey.keyType,
        entropySource: masterKeyData
      }

      const personaData = {
        did: didDocument.getDID(),
        controllingKey: genericSigningKeyData
      }

      await storageLib.store.persona(personaData)
      await storageLib.store.derivedKey(ethereumKeyData)

      dispatch(setDid(didDocument.getDID()))
      const {
        privateKey: ethPrivKey,
        address: ethAddr
      } = ethereumLib.wifToEthereumKey(ethereumKey.wif)

      dispatch(setLoadingMsg(loading.loadingStages[1]))
      const ipfsHash = await jolocomLib.identity.store(didDocument)

      dispatch(setLoadingMsg(loading.loadingStages[2]))
      await ethereumLib.requestEther(ethAddr)

      dispatch(setLoadingMsg('Registering identity on Ethereum'))

        await jolocomLib.identity.register({
        ethereumKey: Buffer.from(ethPrivKey, 'hex'),
        did: didDocument.getDID(),
        ipfsHash
      })

        dispatch(navigationActions.navigatorReset({
        routeName: routeList.SeedPhrase,
        params: { mnemonic }
      }))
    } catch (error) {
      return dispatch(genericActions.showErrorScreen(error))
    }
  }
}
