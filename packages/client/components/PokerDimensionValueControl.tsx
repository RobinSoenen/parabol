import styled from '@emotion/styled'
import graphql from 'babel-plugin-relay/macro'
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {createFragmentContainer} from 'react-relay'
import {PALETTE} from '~/styles/paletteV2'
import useAtmosphere from '../hooks/useAtmosphere'
import useMutationProps from '../hooks/useMutationProps'
import useResizeFontForElement from '../hooks/useResizeFontForElement'
import useSetFinalScoreError, {setFinalScoreError} from '../hooks/useSetFinalScoreError'
import PokerSetFinalScoreMutation from '../mutations/PokerSetFinalScoreMutation'
import {PokerDimensionValueControl_stage} from '../__generated__/PokerDimensionValueControl_stage.graphql'
import LinkButton from './LinkButton'
import MiniPokerCard from './MiniPokerCard'
import PokerDimensionFinalScoreJiraPicker from './PokerDimensionFinalScoreJiraPicker'
import StyledError from './StyledError'

const ControlWrap = styled('div')({
  padding: '0 8px'
})

const Control = styled('div')({
  alignItems: 'center',
  backgroundColor: '#fff',
  border: '2px solid',
  borderColor: PALETTE.TEXT_BLUE,
  borderRadius: 4,
  display: 'flex',
  padding: 6
})

const Input = styled('input')<{color?: string}>(({color}) => ({
  background: 'none',
  border: 0,
  color: color || PALETTE.TEXT_MAIN,
  display: 'block',
  fontSize: 18,
  fontWeight: 600,
  lineHeight: '24px',
  outline: 0,
  padding: 0,
  textAlign: 'center',
  width: '100%',
  '::placeholder': {
    color: 'rgba(125, 125, 125, .25)'
  }
}))

const StyledLinkButton = styled(LinkButton)({
  fontSize: 14,
  fontWeight: 600,
  height: 40,
  margin: '0 0 0 8px',
  padding: '0 8px'
})

const ErrorMessage = styled(StyledError)({
  paddingLeft: 8
})

const Label = styled('div')({
  color: PALETTE.TEXT_MAIN,
  fontSize: 14,
  fontWeight: 600,
  margin: '0 0 0 16px',
  width: '100%'
})

interface Props {
  isFacilitator: boolean
  placeholder: string
  stage: PokerDimensionValueControl_stage
}


const PokerDimensionValueControl = (props: Props) => {
  const {isFacilitator, placeholder, stage} = props
  const {id: stageId, dimension, finalScoreError, meetingId, service, serviceField} = stage
  const finalScore = stage.finalScore || ''
  const {name: serviceFieldName, type: serviceFieldType} = serviceField
  const {selectedScale} = dimension
  const {values: scaleValues} = selectedScale
  const inputRef = useRef<HTMLInputElement>(null)
  const atmosphere = useAtmosphere()
  const {submitMutation, submitting, error, onError, onCompleted} = useMutationProps()
  const [pendingScore, setPendingScore] = useState(finalScore)
  const lastServiceFieldNameRef = useRef(serviceFieldName)
  const canUpdate = pendingScore !== finalScore || lastServiceFieldNameRef.current !== serviceFieldName
  console.log({canUpdate, pendingScore, finalScore, serviceFieldName, last: lastServiceFieldNameRef.current})
  useSetFinalScoreError(stageId, error)

  useLayoutEffect(() => {
    setPendingScore(finalScore)
    lastServiceFieldNameRef.current = serviceFieldName
  }, [finalScore])
  useEffect(() => {
    if (error) {
      // we want this for remote errors but not local errors, so we keep the 2 in different vars
      setPendingScore(finalScore)
    }
  }, [error])

  const submitScore = () => {
    if (submitting || !canUpdate) return
    submitMutation()
    lastServiceFieldNameRef.current = serviceFieldName
    PokerSetFinalScoreMutation(atmosphere, {finalScore: pendingScore, meetingId, stageId}, {onError, onCompleted})
  }

  useResizeFontForElement(inputRef, pendingScore, 12, 18)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = e.target
    if (serviceFieldType === 'number') {
      // isNaN says "3." is a number, so we stringify the parsed number & see if it matches
      if (String(parseFloat(value)) !== value) {
        // the service wants a number but we didn't get one
        setFinalScoreError(atmosphere, stageId, 'The field selected only accepts numbers')
      } else {
        setFinalScoreError(atmosphere, stageId, '')
      }
    }
    setPendingScore(value)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // keydown required bceause escape doesn't fire onKeyPress
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      submitScore()
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setPendingScore(finalScore)
      inputRef.current?.blur()
    }
  }

  const clearError = () => {
    setFinalScoreError(atmosphere, stageId, '')
    onCompleted()
  }


  const matchingScale = scaleValues.find((scaleValue) => scaleValue.label === pendingScore)
  const scaleColor = matchingScale?.color
  const textColor = scaleColor ? '#fff' : undefined
  const isFinal = !!finalScore && pendingScore === finalScore
  return (
    <ControlWrap>
      <Control>
        <MiniPokerCard color={scaleColor} isFinal={isFinal}>
          <Input disabled={!isFacilitator} onKeyDown={onKeyDown} autoFocus={!finalScore} color={textColor} ref={inputRef} onChange={onChange} placeholder={placeholder} value={pendingScore}></Input>
        </MiniPokerCard>
        {!isFacilitator && <Label>{`Final Score${finalScore ? '' : ' (set by facilitator)'}`}</Label>}
        {service === 'jira' && <PokerDimensionFinalScoreJiraPicker canUpdate={canUpdate} stage={stage} error={finalScoreError} submitScore={submitScore} clearError={clearError} isFacilitator={isFacilitator} />}
        {service !== 'jira' &&
          <>
            <StyledLinkButton palette={'blue'}>{'Update Score'}</StyledLinkButton>
            {finalScoreError && <ErrorMessage>{finalScoreError}</ErrorMessage>}
          </>
        }

      </Control>
    </ControlWrap>
  )
}

export default createFragmentContainer(
  PokerDimensionValueControl,
  {
    stage: graphql`
    fragment PokerDimensionValueControl_stage on EstimateStage {
      ...PokerDimensionFinalScoreJiraPicker_stage
      id
      meetingId
      finalScore
      finalScoreError
      serviceField {
        name
        type
      }
      service
      dimension {
        selectedScale {
          values {
            label
            color
          }
        }
      }
    }`
  }
)
