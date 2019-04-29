import {css} from 'aphrodite-local-styles/no-important'
import PropTypes from 'prop-types'
import React from 'react'
import {createFragmentContainer} from 'react-relay'
import actionMeeting from 'universal/modules/meeting/helpers/actionMeeting'
import appTheme from 'universal/styles/theme/appTheme'
import ui from 'universal/styles/ui'
import withStyles from 'universal/styles/withStyles'
import Menu from 'universal/components/Menu'
import MenuItem from 'universal/components/MenuItem'
import textOverflow from 'universal/styles/helpers/textOverflow'

const MeetingAvatarMenu = (props) => {
  const {
    avatar,
    menuProps,
    handleNavigate,
    handlePromote,
    handleRequest,
    localPhase,
    styles
  } = props
  const {isCheckedIn, isConnected, preferredName} = avatar
  const connected = isConnected ? 'connected' : 'disconnected'
  const checkedIn = isCheckedIn ? ' and checked in' : ''
  const headerLabel = `${preferredName} is ${connected} ${checkedIn}`
  const phaseInfo = actionMeeting[localPhase]
  const {name: phaseName} = phaseInfo
  return (
    <Menu ariaLabel={'Select what to do with this team member'} {...menuProps}>
      <div className={css(styles.label)}>{headerLabel}</div>
      {handleNavigate && (
        <MenuItem
          key='handleNavigate'
          label={`See ${preferredName}’s ${phaseName}`}
          onClick={handleNavigate}
        />
      )}
      {handlePromote && (
        <MenuItem
          key='promoteToFacilitator'
          label={`Promote ${preferredName} to Facilitator`}
          onClick={handlePromote}
        />
      )}
      {handleRequest && (
        <MenuItem
          key='requestFacilitator'
          label={'Request to become Facilitator'}
          onClick={handleRequest}
        />
      )}
    </Menu>
  )
}

MeetingAvatarMenu.propTypes = {
  avatar: PropTypes.shape({
    isCheckedIn: PropTypes.bool,
    isConnected: PropTypes.bool,
    preferredName: PropTypes.string
  }).isRequired,
  handleNavigate: PropTypes.func,
  handlePromote: PropTypes.func,
  handleRequest: PropTypes.func,
  localPhase: PropTypes.string.isRequired,
  styles: PropTypes.object
}

const styleThunk = () => ({
  label: {
    ...textOverflow,
    borderBottom: `1px solid ${appTheme.palette.mid30l}`,
    color: ui.palette.dark,
    fontSize: ui.menuItemFontSize,
    fontWeight: 600,
    lineHeight: ui.menuItemHeight,
    marginBottom: ui.menuGutterVertical,
    padding: `0 ${ui.menuGutterHorizontal}`,
    userSelect: 'none'
  }
})

export default createFragmentContainer(
  withStyles(styleThunk)(MeetingAvatarMenu),
  graphql`
    fragment MeetingAvatarMenu_avatar on TeamMember {
      isCheckedIn
      isConnected
      preferredName
    }
  `
)
