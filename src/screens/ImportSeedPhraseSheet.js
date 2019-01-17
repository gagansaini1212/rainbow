import { isValidSeedPhrase as validateSeedPhrase } from 'balance-common';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Clipboard,
  InteractionManager,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { withNavigation } from 'react-navigation';
import {
  compose,
  lifecycle,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { withAccountReset } from '../hoc';
import styled from 'styled-components';
import { Alert } from '../components/alerts';
import { Icon } from '../components/icons';
import { MultiLineInput } from '../components/inputs';
import { Centered, Column, Row } from '../components/layout';
import { Text } from '../components/text';
import { borders, colors, padding } from '../styles';

const Container = styled(Column).attrs({
  align: 'center',
  flex: 1,
})`
  ${borders.buildRadius('top', 12)}
  ${padding(16)};
  background: ${colors.white};
  padding-top: 0;
`;

const Footer = withProps({
  align: 'start',
  behavior: 'padding',
  component: KeyboardAvoidingView,
  justify: 'space-between',
  keyboardVerticalOffset: 80,
  self: 'stretch',
})(Row);

const HandleIcon = styled(Icon).attrs({
  color: '#C4C6CB',
  name: 'handle',
})`
  margin-top: 16px;
  margin-bottom: 2;
`;

const HelpButton = styled(BorderlessButton)`
  ${padding(6, 8)}
  border: 1px solid #f6f7f7;
  border-radius: 15px;
`;

const ImportButton = styled(Row).attrs({
  align: 'center',
  component: BorderlessButton,
})`
  ${padding(6, 8)}
  background: ${props => (props.disabled ? '#D2D3D7' : colors.appleBlue)};
  border-radius: 15px;
  shadow-color: ${colors.dark};
  shadow-offset: 0px 6px;
  shadow-opacity: 0.14;
  shadow-radius: 10;
`;

const InputContainer = styled(Centered)`
  ${padding(0, 50)}
  flex: 1;
`;

const SeedPhraseInput = styled(MultiLineInput)`
  width: 100%;
`;

const ImportSeedPhraseSheet = ({
  isClipboardContentsValidSeedPhrase,
  isSeedPhraseValid,
  onImportSeedPhrase,
  onInputChange,
  onPasteSeedPhrase,
  onPressHelp,
  seedPhrase,
}) => (
  <Container>
    <HandleIcon />
    <Text size="large" weight="bold">
      Import
    </Text>
    <InputContainer>
      <SeedPhraseInput
        align="center"
        autoFocus
        onChange={onInputChange}
        placeholder={'Type your seed phrase'}
        returnKeyType="done"
        size="large"
        value={seedPhrase}
        weight="semibold"
      />
    </InputContainer>
    <Footer>
      <HelpButton onPress={onPressHelp}>
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.8)}
          weight="medium"
        >
          Help
        </Text>
      </HelpButton>
      <ImportButton
        disabled={seedPhrase ? !isSeedPhraseValid : !isClipboardContentsValidSeedPhrase}
        onPress={seedPhrase ? onImportSeedPhrase : onPasteSeedPhrase}
      >
        {!!seedPhrase && (
          <Icon
            color={colors.white}
            direction="right"
            name="arrowCircled"
            style={{ paddingRight: 5 }}
          />
        )}
        <Text
          color="white"
          style={{ paddingLeft: seedPhrase ? 5 : 0 }}
          weight="bold"
        >
          {seedPhrase ? 'Import' : 'Paste'}
        </Text>
      </ImportButton>
    </Footer>
  </Container>
);

ImportSeedPhraseSheet.propTypes = {
  isClipboardContentsValidSeedPhrase: PropTypes.bool,
  isSeedPhraseValid: PropTypes.bool,
  navigation: PropTypes.object,
  onImportSeedPhrase: PropTypes.func,
  onInputChange: PropTypes.func,
  onPasteSeedPhrase: PropTypes.func,
  onPressHelp: PropTypes.func,
  screenProps: PropTypes.shape({ handleWalletConfig: PropTypes.func }),
  seedPhrase: PropTypes.string,
  setSeedPhrase: PropTypes.func,
};

const ConfirmImportSeedPhraseAlert = (onSuccess) => Alert({
  buttons: [{
    onPress: onSuccess,
    text: 'Import',
  }, {
    text: 'Cancel',
    style: 'cancel',
  }],
  // eslint-disable-next-line
  message: 'Importing this seed phrase will overwrite your existing wallet. Before continuing, please make sure you’ve transferred its contents or backed up its seed phrase.',
  title: 'Are you sure you want to import?',
});

export default compose(
  withAccountReset,
  withNavigation,
  withState('clipboardContents', 'setClipboardContents', ''),
  withState('seedPhrase', 'setSeedPhrase', ''),
  lifecycle({
    componentDidMount() {
      InteractionManager.runAfterInteractions(async () => {
        const { setClipboardContents } = this.props;
        await Clipboard.getString().then(setClipboardContents);
      });
    },
  }),
  withHandlers({
    onImportSeedPhrase: ({ accountClearState, navigation, screenProps, seedPhrase }) => () => (
      ConfirmImportSeedPhraseAlert(() => {
        accountClearState();
        screenProps
          .handleWalletConfig(seedPhrase)
          .then((address, test) => {
            console.log('ON IMPORT SEED THEN', address, test);

            if (address) {
              navigation.navigate('WalletScreen');
            }
          })
      })),
    onInputChange: ({ setSeedPhrase }) => ({ nativeEvent }) => setSeedPhrase(nativeEvent.text),
    onPasteSeedPhrase: ({ setSeedPhrase }) => () => {
      Clipboard.getString()
        .then(setSeedPhrase)
        .catch(error => console.log(error));
    },
    onPressHelp: () => () => Linking.openURL('https://support.balance.io'),
  }),
  withProps(({ clipboardContents, seedPhrase }) => ({
    isClipboardContentsValidSeedPhrase: validateSeedPhrase(clipboardContents),
    isSeedPhraseValid: validateSeedPhrase(seedPhrase),
  })),
  onlyUpdateForKeys([
    'isClipboardContentsValidSeedPhrase',
    'isSeedPhraseValid',
    'seedPhrase',
  ]),
)(ImportSeedPhraseSheet);