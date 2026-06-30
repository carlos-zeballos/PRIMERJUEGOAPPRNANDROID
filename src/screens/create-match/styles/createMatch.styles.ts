import { StyleSheet } from 'react-native';
import { CREATE_MATCH_COLORS } from '../constants/createMatch.constants';

export const createMatchStyles = StyleSheet.create({
  title: {
    fontFamily: 'Cinzel-Bold',
    color: CREATE_MATCH_COLORS.textPrimary,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sectionTitle: {
    fontFamily: 'Cinzel-Bold',
    color: CREATE_MATCH_COLORS.textPrimary,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  secondaryLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    color: CREATE_MATCH_COLORS.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  functionalText: {
    fontFamily: 'Inter-Bold',
    color: CREATE_MATCH_COLORS.textPrimary,
    textAlign: 'center',
  },
});
